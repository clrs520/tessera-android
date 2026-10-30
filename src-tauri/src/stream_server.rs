use base64::Engine;
use serde::Serialize;
use std::fs::File;
use std::io::{self, BufReader, Read, Seek, SeekFrom};
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};
use std::sync::Arc;
use tiny_http::{Header, Response, ResponseBox, Server, StatusCode};

// Six feeds stream at once, and each also wants the front MP4 for its telemetry plus the filmstrip
// frames; a worker only returns to `incoming_requests` when its response body is fully written, so
// eight of them is a queue, not a pool.
const WORKER_THREADS: usize = 16;
const URL_PREFIX: &str = "media";
// Reading a 1080p MP4 through an 8 KB buffer is ~500 syscalls per megabyte on a phone's flash, and
// the reads come from the same thread that is supposed to answer the next request.
const READ_BUF_BYTES: usize = 256 * 1024;

// The only folders the loopback server may read from. The scan command registers the folder the
// user opened; until it does, nothing is served. Paths are canonicalised so a symlink inside the
// allowed folder cannot point the server at the rest of the device.
static ALLOWED_ROOTS: OnceLock<Mutex<Vec<PathBuf>>> = OnceLock::new();

fn allowed_roots() -> &'static Mutex<Vec<PathBuf>> {
    ALLOWED_ROOTS.get_or_init(|| Mutex::new(Vec::new()))
}

pub fn set_allowed_roots(roots: Vec<String>) {
    let mut canonical = Vec::new();
    for root in roots {
        if let Ok(path) = std::fs::canonicalize(&root) {
            canonical.push(path);
        }
    }
    *allowed_roots().lock().unwrap_or_else(|poisoned| poisoned.into_inner()) = canonical;
}

fn is_allowed_path(path: &str) -> bool {
    let roots = allowed_roots().lock().unwrap_or_else(|poisoned| poisoned.into_inner());
    // Path::starts_with compares whole components, so /a/TeslaCamX does not match /a/TeslaCam.
    let under = |real: &std::path::Path| roots.iter().any(|root| real == root || real.starts_with(root));
    if let Ok(real) = std::fs::canonicalize(path) {
        return under(&real);
    }
    // A missing file is still inside the folder when its parent is: let the open decide 404
    // instead of turning every gap in a recording into a 403.
    std::path::Path::new(path)
        .parent()
        .and_then(|dir| std::fs::canonicalize(dir).ok())
        .is_some_and(|dir| under(&dir))
}

#[derive(Clone, Serialize)]
pub struct MediaServerInfo {
    pub base_url: String,
    pub token: String,
}

pub fn spawn() -> Result<MediaServerInfo, String> {
    let (server, port) = bind_any_available_port()?;
    let token = random_token();
    let server = Arc::new(server);

    for _ in 0..WORKER_THREADS {
        let server = Arc::clone(&server);
        let token = token.clone();
        std::thread::spawn(move || {
            for request in server.incoming_requests() {
                respond(request, &token);
            }
        });
    }

    Ok(MediaServerInfo {
        base_url: format!("http://127.0.0.1:{}", port),
        token,
    })
}

// Bind through a probe listener so we learn the ephemeral port without relying on
// the server's own address accessor, then hand the port to tiny_http.
fn bind_any_available_port() -> Result<(Server, u16), String> {
    let mut last_err = String::from("no port available");
    for _ in 0..5 {
        let port = {
            let probe = std::net::TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
            probe.local_addr().map_err(|e| e.to_string())?.port()
        };
        match Server::http(format!("127.0.0.1:{}", port)) {
            Ok(server) => return Ok((server, port)),
            Err(e) => last_err = e.to_string(),
        }
    }
    Err(last_err)
}

fn random_token() -> String {
    let mut raw = [0u8; 16];
    if let Ok(mut urandom) = File::open("/dev/urandom") {
        let _ = urandom.read_exact(&mut raw);
    } else {
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_nanos() as u64)
            .unwrap_or(0)
            ^ (std::process::id() as u64) << 32;
        for (i, byte) in raw.iter_mut().enumerate() {
            *byte = (nanos >> (i % 8 * 8)) as u8;
        }
    }
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(raw)
}

fn header_value<'h>(headers: &'h [Header], name: &'static str) -> Option<&'h str> {
    headers
        .iter()
        .find(|h| h.field.equiv(name))
        .map(|h| h.value.as_str())
}

fn extra_header(name: &str, value: &str) -> Option<Header> {
    Header::from_bytes(name.as_bytes(), value.as_bytes()).ok()
}

const APP_ORIGINS: [&str; 3] = ["http://tauri.localhost", "https://tauri.localhost", "tauri://localhost"];

fn cors_origin(origin: Option<&str>) -> Option<&'static str> {
    let given = origin?;
    APP_ORIGINS.iter().copied().find(|allowed| allowed.eq_ignore_ascii_case(given))
}

fn base_headers(origin: Option<&str>) -> Vec<Header> {
    let mut headers = Vec::new();
    // The page is the only reader that needs CORS (its own origin, or the video grabber that asks
    // with crossorigin). Anything else gets no allow-origin header, so a stray local web page
    // cannot read a response even if it somehow learned a URL.
    if let Some(allowed) = cors_origin(origin) {
        if let Some(h) = extra_header("Access-Control-Allow-Origin", allowed) {
            headers.push(h);
        }
    }
    if let Some(h) = extra_header("Vary", "Origin") {
        headers.push(h);
    }
    if let Some(h) = extra_header("Accept-Ranges", "bytes") {
        headers.push(h);
    }
    // Without any freshness information a media element revalidates on every `src` reassignment —
    // which a layout change or a step back through the segments does — and with no ETag either,
    // "revalidate" means pulling the whole file again. One minute is short enough that a clip
    // replaced on the card self-heals on its own.
    if let Some(h) = extra_header("Cache-Control", "private, max-age=60") {
        headers.push(h);
    }
    headers
}

fn content_type_for(path: &str) -> &'static str {
    let lower = path.to_ascii_lowercase();
    if lower.ends_with(".mp4") || lower.ends_with(".m4v") {
        "video/mp4"
    } else if lower.ends_with(".mov") {
        "video/quicktime"
    } else if lower.ends_with(".json") {
        "application/json"
    } else if lower.ends_with(".png") {
        "image/png"
    } else if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
        "image/jpeg"
    } else {
        "application/octet-stream"
    }
}

fn decode_requested_path(url: &str, token: &str) -> Option<String> {
    let trimmed = url.trim_start_matches('/');
    let mut segments = trimmed.splitn(3, '/');
    let prefix = segments.next()?;
    let given_token = segments.next()?;
    let encoded_path = segments.next()?;

    if prefix != URL_PREFIX || !token_matches(given_token, token) {
        return None;
    }

    let bytes = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(encoded_path)
        .ok()?;
    let path = String::from_utf8(bytes).ok()?;

    if path.is_empty() || !path.starts_with('/') || path.contains('\0') || path.contains("..") {
        return None;
    }
    // The token is the only thing between a local app and everything this process can read, and a
    // bearer string can leak (it travels in a URL). Constrain what the server is willing to open:
    // media extensions only, never the kernel trees, never the app's own private data.
    if !is_media_path(&path) {
        return None;
    }
    Some(path)
}

// Constant-time comparison: a `!=` on the token returns as soon as the first byte differs, which
// turns the token into a byte-at-a-time oracle over loopback. Same length first (the length is a
// fixed 22 chars, so this leaks nothing), then fold every byte.
fn token_matches(given: &str, expected: &str) -> bool {
    let a = given.as_bytes();
    let b = expected.as_bytes();
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for i in 0..a.len() {
        diff |= a[i] ^ b[i];
    }
    diff == 0
}

// `json` is here because a TeslaCam event folder carries its sidecar files beside the clips, and
// `TauriFile.text()` reads them through this same server. Leaving it out made every `event.json`
// come back as an empty body, which the page's `JSON.parse` swallowed — the list lost its city,
// street and `reason`, and with the reason gone the trigger outline, the burned-in badge and the
// 「只看触发」 filter all went quietly blank. The root allowlist is what keeps this narrow; the
// extension list only has to cover the file types a camera folder actually contains.
const MEDIA_EXTENSIONS: &[&str] = &[
    "mp4", "m4v", "mov", "mkv", "avi", "ts", "m2ts", "3gp", "webm", "png", "jpg", "jpeg", "json",
];
// Everything under these is either kernel state or this app's private storage. A dashcam player
// never needs any of it, so a request for one is a probe rather than a clip.
const FORBIDDEN_ROOTS: &[&str] = &[
    "/proc", "/sys", "/dev", "/data", "/apex", "/system", "/vendor", "/product", "/metadata",
];

fn is_media_path(path: &str) -> bool {
    let lower = path.to_ascii_lowercase();
    for root in FORBIDDEN_ROOTS {
        if lower == *root || lower.starts_with(&format!("{root}/")) {
            return false;
        }
    }
    match lower.rsplit_once('.') {
        Some((_, ext)) => MEDIA_EXTENSIONS.contains(&ext),
        None => false,
    }
}

// "bytes=100-200" / "bytes=100-" / "bytes=-50" against a known file size. The three outcomes are
// not the same thing: a syntactically valid range past the end has to answer 416 (a media element
// asks this on every seek near the tail and needs the refusal), while a header the parser cannot
// understand is ignored and the whole file is sent, as RFC 9110 says.
enum RangeRequest {
    Satisfiable(u64, u64),
    Unsatisfiable,
    Malformed,
}

fn parse_range(spec: &str, file_len: u64) -> RangeRequest {
    let Some(suffix) = spec.trim().strip_prefix("bytes=") else {
        return RangeRequest::Malformed;
    };
    let mut parts = suffix.splitn(2, '-');
    let Some(start_part) = parts.next().map(str::trim) else {
        return RangeRequest::Malformed;
    };
    let end_part = parts.next().unwrap_or("").trim();

    if start_part.is_empty() {
        // suffix range: last N bytes
        let Ok(n) = end_part.parse::<u64>() else {
            return RangeRequest::Malformed;
        };
        if n == 0 || file_len == 0 {
            return RangeRequest::Unsatisfiable;
        }
        let start = file_len.saturating_sub(n);
        return RangeRequest::Satisfiable(start, file_len - 1);
    }

    let Ok(start) = start_part.parse::<u64>() else {
        return RangeRequest::Malformed;
    };
    if start >= file_len {
        // `file_len == 0` lands here too, and is unsatisfiable rather than malformed.
        return RangeRequest::Unsatisfiable;
    }
    let end = if end_part.is_empty() {
        file_len - 1
    } else {
        let Ok(parsed) = end_part.parse::<u64>() else {
            return RangeRequest::Malformed;
        };
        parsed.min(file_len - 1)
    };
    if end < start {
        return RangeRequest::Malformed;
    }
    RangeRequest::Satisfiable(start, end)
}

fn simple_response(status: u16, origin: Option<&str>) -> Response<io::Empty> {
    Response::new(StatusCode(status), base_headers(origin), io::empty(), Some(0), None)
}

fn range_not_satisfiable(file_len: u64, origin: Option<&str>) -> Response<io::Empty> {
    let mut headers = base_headers(origin);
    if let Some(h) = extra_header("Content-Range", &format!("bytes */{file_len}")) {
        headers.push(h);
    }
    Response::new(StatusCode(416), headers, io::empty(), Some(0), None)
}

fn respond(request: tiny_http::Request, token: &str) {
    let url = request.url().to_string();
    let is_head = request.method().as_str().eq_ignore_ascii_case("HEAD");
    let range = header_value(request.headers(), "Range").map(|s| s.to_string());
    // Cloned before the request is consumed by respond().
    let origin = header_value(request.headers(), "Origin").map(|s| s.to_string());
    let origin = origin.as_deref();

    let path = match decode_requested_path(&url, token) {
        Some(p) => p,
        None => {
            let _ = request.respond(simple_response(403, origin));
            return;
        }
    };

    // The boundary is the scanned folder, not "any media file on the device": a token holder can
    // only walk the library the user opened. Checked before the file probes so an outside path
    // cannot be used as a file-existence oracle.
    if !is_allowed_path(&path) {
        let _ = request.respond(simple_response(403, origin));
        return;
    }

    // `symlink_metadata` does not follow the link: a symlink inside a camera folder would let the
    // path checks above be decided on one file and the bytes come from another.
    match std::fs::symlink_metadata(&path) {
        Ok(m) if m.is_file() && !m.file_type().is_symlink() => {}
        _ => {
            let _ = request.respond(simple_response(404, origin));
            return;
        }
    }

    let file = match File::open(&path) {
        Ok(f) => f,
        Err(_) => {
            let _ = request.respond(simple_response(404, origin));
            return;
        }
    };

    let file_len = match file.metadata() {
        Ok(m) => m.len(),
        Err(_) => {
            let _ = request.respond(simple_response(500, origin));
            return;
        }
    };

    let mut headers = base_headers(origin);
    if let Some(h) = extra_header("Content-Type", content_type_for(&path)) {
        headers.push(h);
    }

    let (status, start, end) = match range.as_deref().map(|s| parse_range(s, file_len)) {
        Some(RangeRequest::Satisfiable(start, end)) => (206u16, start, end),
        Some(RangeRequest::Unsatisfiable) => {
            let _ = request.respond(range_not_satisfiable(file_len, origin));
            return;
        }
        Some(RangeRequest::Malformed) | None => (200u16, 0, file_len.saturating_sub(1)),
    };

    if status == 206 {
        if let Some(h) = extra_header(
            "Content-Range",
            &format!("bytes {}-{}/{}", start, end, file_len),
        ) {
            headers.push(h);
        }
    }

    let length = if file_len == 0 {
        0usize
    } else {
        (end - start + 1) as usize
    };

    let body: Box<dyn Read + Send> = if is_head || length == 0 {
        Box::new(io::empty())
    } else if start == 0 && length as u64 == file_len {
        Box::new(BufReader::with_capacity(READ_BUF_BYTES, file))
    } else {
        let mut sliced = file;
        if sliced.seek(SeekFrom::Start(start)).is_err() {
            let _ = request.respond(simple_response(416, origin));
            return;
        }
        Box::new(BufReader::with_capacity(READ_BUF_BYTES, sliced.take(length as u64)))
    };

    let response: ResponseBox = Response::new(StatusCode(status), headers, body, Some(length), None);
    let _ = request.respond(response);
}

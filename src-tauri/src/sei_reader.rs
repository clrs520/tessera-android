//! Native SEI telemetry reader.
//!
//! Tesla stores the driving telemetry in H.264 SEI NAL units inside `mdat`, and the frame time
//! comes from the sample durations in `moov`. Reading it in JS means pulling the whole MP4
//! (measured: 50.9 MB for one `front` segment) over the loopback server into an `ArrayBuffer`
//! before a single byte can be counted — 2.5 s per segment, on the same thread that is decoding
//! video. The walk itself only costs 40 ms, so the bytes are the problem.
//!
//! This does the walk on the file handle and returns only the SEI payloads and their times,
//! roughly 120 KB per segment. The protobuf decode deliberately stays in JS: `dashcam.proto` is
//! the contract there, and duplicating it would give the two platforms a second parser to keep
//! in step.
//!
//! Every judgement below is a port of `DashcamMP4.getConfig` / `parseMetadata` / `decodeSeiToRaw`
//! / `stripEmulationBytes` in `src/dashcam-mp4.js`, including where that parser is lenient — the
//! NAL bounds check is against the *file* length, not the end of `mdat`. The acceptance test is
//! point-by-point equality with the JS path on the same file, so matching the reference exactly,
//! quirks included, is the requirement rather than a suggestion.

use serde::Serialize;
use std::io::{Read, Seek, SeekFrom};

/// One SEI message: seconds from the start of the segment, and the raw protobuf payload with
/// the H.264 emulation-prevention bytes already removed.
#[derive(Clone, Serialize)]
pub struct SeiSample {
    pub time: f64,
    pub payload: Vec<u8>,
}

/// A `moov` bigger than this is not a dashcam segment, and reading it blind would be the freeze
/// this module exists to remove.
const MAX_MOOV_BYTES: u64 = 32 * 1024 * 1024;
/// The largest single NAL this will hold. Dashcam footage is nowhere near it; a file that needs
/// more is treated as malformed and the caller falls back to the JS path.
const WINDOW_LIMIT: usize = 8 * 1024 * 1024;
const CHUNK: usize = 512 * 1024;

#[derive(Clone, Copy)]
struct TopBox {
    kind: [u8; 4],
    /// First content byte, i.e. past the 8- or 16-byte header.
    start: u64,
    /// Content length.
    size: u64,
}

fn u32_at(b: &[u8], at: usize) -> Option<u32> {
    let four: [u8; 4] = b.get(at..at + 4)?.try_into().ok()?;
    Some(u32::from_be_bytes(four))
}

/// Top-level boxes, read from the headers alone. `size == 1` carries the real size in the 64-bit
/// field after the header and `size == 0` means "to end of file", which is what `findBox` does.
fn scan_top(file: &mut std::fs::File, file_len: u64) -> Result<Vec<TopBox>, String> {
    let mut boxes = Vec::new();
    let mut pos = 0u64;
    let mut head = [0u8; 8];
    while pos + 8 <= file_len {
        file.seek(SeekFrom::Start(pos)).map_err(|e| format!("seek {pos}: {e}"))?;
        file.read_exact(&mut head).map_err(|e| format!("header @{pos}: {e}"))?;
        let declared = u32::from_be_bytes([head[0], head[1], head[2], head[3]]) as u64;
        let mut kind = [0u8; 4];
        kind.copy_from_slice(&head[4..8]);

        let (size, header_size) = match declared {
            1 => {
                let mut wide = [0u8; 8];
                file.read_exact(&mut wide).map_err(|e| format!("wide @{pos}: {e}"))?;
                (u64::from_be_bytes(wide), 16u64)
            }
            0 => (file_len - pos, 8u64),
            other => (other, 8u64),
        };
        if size < header_size {
            break;
        }
        boxes.push(TopBox {
            kind,
            start: pos + header_size,
            size: size - header_size,
        });
        pos += size;
    }
    Ok(boxes)
}

/// Direct children only, exactly like `findBox`: returns the content range of the first box
/// named `name`, relative to the slice handed in. Descending the trak/mdia/minf/stbl chain is
/// therefore a sequence of one-level lookups on nested slices.
fn child(content: &[u8], name: &[u8; 4]) -> Option<(usize, usize)> {
    let mut pos = 0usize;
    while pos + 8 <= content.len() {
        let declared = u32_at(content, pos)? as usize;
        let header_size = if declared == 1 { 16 } else { 8 };
        let size = match declared {
            0 => content.len() - pos,
            1 => usize::try_from(u64::from_be_bytes(
                content.get(pos + 8..pos + 16)?.try_into().ok()?,
            ))
            .unwrap_or(0),
            other => other,
        };
        if size < header_size {
            return None;
        }
        // A box may declare more bytes than the parent holds — the JS `findBox` gets this for free
        // because `subarray` clamps, while a Rust slice of `pos + size` panics. Rust builds abort on
        // panic, so one corrupt `moov` header used to take the whole app down; clamp so a malformed
        // box simply ends the walk, exactly like the JS side.
        let end = pos.saturating_add(size).min(content.len());
        if content.get(pos + 4..pos + 8) == Some(name.as_slice()) {
            return Some((pos + header_size, end));
        }
        pos = end;
    }
    None
}

/// Frame durations in mdhd ticks, expanded one element per sample exactly as JS pushes them into
/// `config.durations`.
///
/// `count` comes straight from the file and is expanded into that many `u32`s; a corrupt or hostile
/// `stts` claiming four billion samples asked for a 16 GB allocation in one push and aborted the
/// process. A Tesla clip is 60 s at 36 fps, so a million samples is already far past anything real;
/// past that the command fails and the caller falls back to the JS parser.
const MAX_STTS_SAMPLES: usize = 1_000_000;
// A dashcam minute carries a few dozen telemetry payloads. These two caps only exist to stop a
// crafted file (mdat full of SEI NALs) from turning the sample list into gigabytes.
const MAX_SEI_SAMPLES: usize = 4096;
const MAX_SEI_BYTES: usize = 4 * 1024 * 1024;

fn stts_deltas(stbl: &[u8]) -> Option<Vec<u32>> {
    let (start, end) = child(stbl, b"stts")?;
    let stts = &stbl[start..end];
    let entry_count = u32_at(stts, 4)? as usize;
    let mut deltas = Vec::new();
    let mut pos = 8usize;
    for _ in 0..entry_count {
        let count = u32_at(stts, pos)? as usize;
        let delta = u32_at(stts, pos + 4)?;
        if deltas.len().saturating_add(count) > MAX_STTS_SAMPLES {
            return None;
        }
        for _ in 0..count {
            deltas.push(delta);
        }
        pos += 8;
    }
    Some(deltas)
}

/// Ticks per second from the first trak's `mdhd`. Version 1 puts it 20 bytes into the body
/// instead of 12 because its creation and modification times are 64-bit.
fn mdhd_timescale(mdia: &[u8]) -> Option<u64> {
    let (start, end) = child(mdia, b"mdhd")?;
    let mdhd = &mdia[start..end];
    let at = if *mdhd.first()? == 1 { 20 } else { 12 };
    Some(u32_at(mdhd, at)? as u64)
}

/// H.264 emulation-prevention removal, byte-for-byte the JS `stripEmulationBytes`: a `0x03` that
/// follows two `0x00` bytes was stuffed in by the encoder and must be dropped. The zero run
/// resets when the `0x03` is skipped, not when it is kept.
fn strip_emulation_bytes(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(data.len());
    let mut zeros = 0u32;
    for &byte in data {
        if zeros >= 2 && byte == 0x03 {
            zeros = 0;
            continue;
        }
        out.push(byte);
        zeros = if byte == 0 { zeros + 1 } else { 0 };
    }
    out
}

/// The Tesla SEI magic: a run of `0x42` bytes then `0x69`, with the protobuf after it. `i` starts
/// at 3 because the NAL header and the payload type/size occupy that much; requiring `i > 3` is
/// what rejects any SEI that is not a Tesla one. The trailing byte is dropped as a stop bit.
fn decode_sei_to_raw(nal: &[u8]) -> Option<Vec<u8>> {
    if nal.len() < 4 {
        return None;
    }
    let mut i = 3usize;
    while i < nal.len() && nal[i] == 0x42 {
        i += 1;
    }
    if i <= 3 || i + 1 >= nal.len() || nal[i] != 0x69 {
        return None;
    }
    Some(strip_emulation_bytes(&nal[i + 1..nal.len() - 1]))
}

/// `{time, payload}` for every Tesla SEI in one MP4, in the order they appear.
pub fn read_sei(path: &str) -> Result<Vec<SeiSample>, String> {
    let mut file = std::fs::File::open(path).map_err(|e| format!("{path}: {e}"))?;
    let file_len = file
        .metadata()
        .map_err(|e| format!("{path}: metadata: {e}"))?
        .len();

    let tops = scan_top(&mut file, file_len)?;
    let mdat = tops.iter().find(|b| b.kind == *b"mdat").ok_or("mdat not found")?;
    let moov = tops.iter().find(|b| b.kind == *b"moov").ok_or("moov not found")?;
    if moov.size > MAX_MOOV_BYTES {
        return Err(format!("moov too large: {}", moov.size));
    }

    let mut moov_body = vec![0u8; moov.size as usize];
    file.seek(SeekFrom::Start(moov.start)).map_err(|e| e.to_string())?;
    file.read_exact(&mut moov_body).map_err(|e| e.to_string())?;

    let (trak_start, trak_end) = child(&moov_body, b"trak").ok_or("trak not found")?;
    let trak = &moov_body[trak_start..trak_end];
    let (mdia_start, mdia_end) = child(trak, b"mdia").ok_or("mdia not found")?;
    let mdia = &trak[mdia_start..mdia_end];
    let (minf_start, minf_end) = child(mdia, b"minf").ok_or("minf not found")?;
    let minf = &mdia[minf_start..minf_end];
    let (stbl_start, stbl_end) = child(minf, b"stbl").ok_or("stbl not found")?;
    let stbl = &minf[stbl_start..stbl_end];

    let timescale = mdhd_timescale(mdia).ok_or("mdhd timescale not found")?;
    if timescale == 0 {
        return Err("mdhd timescale is 0".into());
    }
    let deltas = stts_deltas(stbl).ok_or("stts not found")?;

    walk_mdat(&mut file, file_len, mdat.start, mdat.size, &deltas, timescale)
}

/// Streams `mdat` with a bounded window, parsing one length-prefixed NAL at a time.
fn walk_mdat(
    file: &mut std::fs::File,
    file_len: u64,
    mdat_start: u64,
    mdat_size: u64,
    deltas: &[u32],
    timescale: u64,
) -> Result<Vec<SeiSample>, String> {
    if mdat_size == 0 {
        return Ok(Vec::new());
    }
    let mdat_end = mdat_start.saturating_add(mdat_size);
    let mut samples = Vec::new();
    let mut sei_bytes = 0usize;
    let mut buf: Vec<u8> = Vec::with_capacity(CHUNK * 2);
    // File offset of `buf[0]`, and the read cursor within `buf`.
    let mut base = mdat_start;
    let mut cursor = 0usize;
    let mut frame_index: usize = 0;
    let mut current_ms: f64 = 0.0;
    let mut eof = false;

    file.seek(SeekFrom::Start(base)).map_err(|e| e.to_string())?;

    loop {
        while buf.len() - cursor < 4 {
            if !fill(file, &mut buf, &mut eof)? {
                return Ok(samples);
            }
        }
        let nal_size = u32_at(&buf, cursor).ok_or("no nal length")? as usize;
        cursor += 4;

        // Faithful to the reference: the bound is the whole *file*, not `mdat`, so a truncated
        // tail ends the walk instead of skipping past it.
        let abs_cursor = base + cursor as u64;
        if nal_size < 1 || abs_cursor + nal_size as u64 > file_len {
            return Ok(samples);
        }
        if nal_size > WINDOW_LIMIT {
            return Err(format!("nal too large: {nal_size}"));
        }

        while buf.len() - cursor < nal_size {
            if !fill(file, &mut buf, &mut eof)? {
                return Ok(samples);
            }
        }
        let nal = &buf[cursor..cursor + nal_size];
        let nal_type = nal[0] & 0x1f;

        if nal_type == 6 {
            // Payload type 5 is user data unregistered, which is where Tesla puts the protobuf.
            if nal.get(1) == Some(&5) {
                if let Some(payload) = decode_sei_to_raw(nal) {
                    // A dashcam clip carries a handful of telemetry payloads; a crafted MP4 can carry
                    // thousands of 8 MB ones and this Vec (then its JSON serialisation) would take the
                    // process down. Stop collecting past a sane budget instead of trusting `mdat`.
                    if samples.len() < MAX_SEI_SAMPLES && sei_bytes + payload.len() <= MAX_SEI_BYTES {
                        sei_bytes += payload.len();
                        samples.push(SeiSample { time: current_ms / 1000.0, payload });
                    }
                }
            }
        } else if nal_type == 1 || nal_type == 5 {
            if let Some(&delta_ticks) = deltas.get(frame_index) {
                current_ms += delta_ticks as f64 / timescale as f64 * 1000.0;
            }
            frame_index += 1;
        }
        cursor += nal_size;

        if abs_cursor >= mdat_end {
            return Ok(samples);
        }
        if cursor > CHUNK {
            buf.drain(..cursor);
            base += cursor as u64;
            cursor = 0;
        }
    }
}

/// Appends one chunk from the file. `false` means the file ran out, so the caller stops the walk
/// the same way a short buffer does in JS.
fn fill(file: &mut std::fs::File, buf: &mut Vec<u8>, eof: &mut bool) -> Result<bool, String> {
    if *eof {
        return Ok(false);
    }
    let offset = buf.len();
    buf.resize(offset + CHUNK, 0);
    let read = file.read(&mut buf[offset..]).map_err(|e| format!("read: {e}"))?;
    buf.truncate(offset + read);
    if read < CHUNK {
        *eof = true;
    }
    Ok(read > 0)
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod mp4_duration;
mod sei_reader;
mod stream_server;

use serde::Serialize;
use sei_reader::SeiSample;
use tauri::Emitter;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
use std::sync::{Mutex, OnceLock};
use stream_server::MediaServerInfo;

static MEDIA_SERVER: OnceLock<Option<MediaServerInfo>> = OnceLock::new();
static SCAN_FILES_SEEN: AtomicUsize = AtomicUsize::new(0);
static SCAN_RUNNING: AtomicBool = AtomicBool::new(false);
/// R191 — where the per-drive "path → bytes" index lives. Set once from `app_cache_dir`; unset means
/// no cache at all (the desktop scan, which reads local disks where a stat is free).
static SCAN_INDEX_DIR: OnceLock<std::path::PathBuf> = OnceLock::new();
/// R168 — only the newest scan may point the media server at its own root. Two scans can overlap
/// when the user picks another folder mid-walk, and the older one finishing must not take the
/// server away from the folder the screen is actually showing.
static LATEST_SCAN_ID: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
static MEDIA_SERVER_LOCK: Mutex<()> = Mutex::new(());

#[derive(Clone, Serialize)]
struct StorageProbe {
    readable: bool,
    entries: usize,
    sample: Vec<String>,
    error: String,
}

#[derive(Clone, Serialize)]
struct StorageStatus {
    app_files_dir: String,
    root_readable: bool,
    download_readable: bool,
    android_data_readable: bool,
    error: String,
}

const SHARED_ROOT: &str = "/storage/emulated/0";

fn first_dir_error(paths: &[&str]) -> String {
    for path in paths {
        if let Err(e) = std::fs::read_dir(path) {
            return format!("{path}: {e}");
        }
    }
    String::new()
}

/// Reports whether shared storage is reachable, which distinguishes "the permission
/// was never granted" from "the folder really has no videos".
///
/// `app_files_dir` is empty unless the folder can actually be listed. Android 11+ refuses the
/// app even a `mkdir` of its own folder under `Android/data` (measured: that listing answers
/// EACCES), so the concatenated guess is usually a path that does not exist — and offering it
/// sends people into a 「文件夹已经不在了」 card. `MainActivity.appFilesDir` is the call that
/// really creates it; this one only reports what it can prove.
#[tauri::command]
async fn storage_status(app: tauri::AppHandle) -> StorageStatus {
    let guess = format!("{SHARED_ROOT}/Android/data/{}/files", app.config().identifier);
    // A synchronous `#[tauri::command]` runs on the UI thread on Android, and this one creates a
    // directory and lists as many as five of them — on a stick behind FUSE that is seconds of
    // frozen WebView. Same reason and same helper as `scan_media_dir` below.
    blocking(move || Ok(read_storage_status(guess)))
        .await
        .unwrap_or_else(|error| StorageStatus {
            app_files_dir: String::new(),
            root_readable: false,
            download_readable: false,
            android_data_readable: false,
            error,
        })
}

fn read_storage_status(guess: String) -> StorageStatus {
    let _ = std::fs::create_dir_all(&guess);
    let app_files_dir = if std::fs::read_dir(&guess).is_ok() {
        guess
    } else {
        String::new()
    };

    let android_data = format!("{SHARED_ROOT}/Android/data");
    let download = format!("{SHARED_ROOT}/Download");
    let error = first_dir_error(&[SHARED_ROOT, &download, &android_data]);

    StorageStatus {
        root_readable: std::fs::read_dir(SHARED_ROOT).is_ok(),
        download_readable: std::fs::read_dir(&download).is_ok(),
        android_data_readable: std::fs::read_dir(&android_data).is_ok(),
        app_files_dir,
        error,
    }
}

#[tauri::command]
async fn write_binary_file(path: String, bytes: Vec<u8>) -> Result<(), String> {
    // A clip is a few hundred megabytes and the target is often the stick, so this is the
    // longest single filesystem call the app makes — and on Android a synchronous command runs
    // on the UI thread, where it reads as a freeze partway through 「下载视频」.
    blocking(move || {
        if path.trim().is_empty() {
            return Err("missing file path".to_string());
        }
        std::fs::write(&path, bytes).map_err(|e| format!("write file failed: {e}"))
    })
    .await
}

/// Android's WebView cannot stream files through Tauri's asset protocol (upstream
/// issue tauri#14776 truncates the body, which breaks MP4 seeking), so media is
/// served over loopback HTTP with Range support instead.
#[tauri::command]
fn ensure_media_server() -> Result<MediaServerInfo, String> {
    let _guard = match MEDIA_SERVER_LOCK.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };

    if let Some(Some(info)) = MEDIA_SERVER.get() {
        return Ok(info.clone());
    }

    let info = stream_server::spawn()?;
    let _ = MEDIA_SERVER.set(Some(info.clone()));
    Ok(info)
}

const PROBE_SAMPLE_LEN: usize = 6;

/// `sample` exists so a screenshot alone can tell "the folder really is empty" apart
/// from "the copy landed somewhere else" — the names are printed in the empty-scan toast.
#[tauri::command]
async fn probe_readable(path: String) -> StorageProbe {
    // An unreadable folder is reported inside the probe rather than as an error, so the only
    // failure left here is the blocking task itself — and that reads the same from the front end.
    blocking(move || probe_tree(&path)).await.unwrap_or_else(|error| StorageProbe {
        readable: false,
        entries: 0,
        sample: Vec::new(),
        error,
    })
}

fn probe_tree(path: &str) -> Result<StorageProbe, String> {
    match std::fs::read_dir(path) {
        Ok(entries) => {
            let mut sample = Vec::new();
            let mut count = 0usize;
            for entry in entries.flatten() {
                count += 1;
                if sample.len() < PROBE_SAMPLE_LEN {
                    let name = match entry.file_name().into_string() {
                        Ok(name) => name,
                        Err(_) => String::from("<non-utf8>"),
                    };
                    sample.push(if entry_is_dir(&entry) {
                        format!("{name}/")
                    } else {
                        name
                    });
                }
            }
            Ok(StorageProbe {
                readable: true,
                entries: count,
                sample,
                error: String::new(),
            })
        }
        Err(e) => Ok(StorageProbe {
            readable: false,
            entries: 0,
            sample: Vec::new(),
            error: e.to_string(),
        }),
    }
}

/// Walking the whole TeslaCam tree through the JS fs plugin costs one IPC call per
/// directory and is additionally gated by that plugin's own path scope, so the scan
/// happens here instead. Unreadable subfolders are skipped, not fatal.
///
/// A stick pulled into a phone is the worst input this ever gets: tens of thousands of
/// entries on VFAT behind FUSE, where `Path::is_dir()` is a fresh `stat` each time and
/// half the tree is neither video nor Tesla at all. So the walk asks the directory entry
/// for its type, keeps only the handful of names the player reads, and stops on a
/// directory budget rather than on how long it took — the alternative is that picking the
/// folder looks like the app froze, because on Android it did.
///
/// The first budget was 20 000 files / 3 000 folders, chosen against a nearly empty stick.
/// A real 1.9 TB one measured 66 880 clips + 3 168 sidecar pairs across 3 168 event folders:
/// the app silently showed 27% of it, and *which* 27% depended on the folder listing order.
/// The budgets below cover that whole stick with headroom; past them the walk now keeps the
/// recent end instead of an arbitrary slice (see `walk_dir`), and the toast still says so.
const MAX_SCAN_DEPTH: usize = 12;
const MAX_SCAN_FILES: usize = 120_000;
const MAX_SCAN_DIRS: usize = 6_000;

/// Recent driving first, then events the driver chose to save, then sentry events. Used only to
/// spend the file budget when a stick is larger than the limits above.
const CATEGORY_ORDER: [&str; 3] = ["RecentClips", "SavedClips", "SentryClips"];

fn category_rank(name: &str) -> usize {
    CATEGORY_ORDER
        .iter()
        .position(|category| category.eq_ignore_ascii_case(name))
        .unwrap_or(CATEGORY_ORDER.len())
}

/// The four names a TeslaCam folder actually contains. Everything else on a stick is dead
/// weight twice over: once to look at, once to serialise back across the bridge.
fn is_media_file(path: &str) -> bool {
    let name = path.rsplit(['/', '\\']).next().unwrap_or(path).to_ascii_lowercase();
    name.ends_with(".mp4") || name.ends_with(".png") || name.ends_with(".jpg") || name == "event.json"
}

fn entry_is_dir(entry: &std::fs::DirEntry) -> bool {
    // `file_type` answers from the directory entry where the filesystem reports it and only falls
    // back to a `stat` where it cannot; `Path::is_dir` has no such fast path.
    entry.file_type().map(|kind| kind.is_dir()).unwrap_or(false)
}

#[derive(Default)]
struct WalkBudget {
    files: usize,
    dirs: usize,
}

impl WalkBudget {
    fn spent(&self) -> bool {
        self.files >= MAX_SCAN_FILES || self.dirs >= MAX_SCAN_DIRS
    }
}

/// Is this the view the player uses as its reference clock? Both Tesla layouts put the camera on
/// one end of the stem: `2026-10-08_11-42-42-front.mp4`, and on some firmware `front-<stamp>`.
fn is_front_clip(path: &str) -> bool {
    let name = path.rsplit(['/', '\\']).next().unwrap_or(path).to_ascii_lowercase();
    name.ends_with("-front.mp4") || name.starts_with("front-")
}

/// The bucket the cameras of one clip share: parent folder + the full `YYYY-MM-DD_HH-MM-SS`
/// stamp, which is also what makes two clips that start in the same minute different clips.
/// Grouping by the minute instead let the first one read answer for both — a real SavedClips
/// pair (`07-33-00`, 59.955 s, and `07-33-08`, 62.039 s) booked the wrong length on whichever
/// file the slot kept. Names that do not start with a stamp keep their own bucket.
fn clip_stamp_key(path: &str) -> String {
    let Some((dir, name)) = path.rsplit_once(['/', '\\']) else { return path.to_string() };
    let stem = name.rsplit_once('.').map(|(stem, _)| stem).unwrap_or(name);
    let Some(head) = stem.get(..19) else { return path.to_string() };
    let bytes = head.as_bytes();
    let dated = bytes.get(4) == Some(&b'-') && bytes.get(7) == Some(&b'-')
        && bytes.get(10) == Some(&b'_') && bytes.get(13) == Some(&b'-')
        && bytes.get(16) == Some(&b'-');
    if dated { format!("{dir}/{head}") } else { path.to_string() }
}

#[derive(Default, Clone, Copy)]
struct ClipGroup {
    /// What the player's reference feed actually runs for, in ms.
    front: Option<u64>,
    /// Any other view of the same minute, for a minute whose front file is missing.
    any: Option<u64>,
}

/// Duration bookkeeping for one scan.
///
/// Every clip used to be booked at 60 s because measuring one meant fetching the file; a real
/// 2026 stick has a 20.6 s first clip and 59.5–62.9 s clips after it, so the whole timeline
/// drifted from the second segment on. The scan already walks the folder, so it reads `mvhd`
/// here instead — one probe per camera timestamp, not per file (six cameras of one clip make one).
#[derive(Default)]
struct ClipLengths {
    groups: Vec<ClipGroup>,
    by_key: std::collections::HashMap<String, usize>,
    /// Group index per scanned file, in the same order as `files`; `NO_CLIP_GROUP` for non-video.
    per_file: Vec<usize>,
    probes: usize,
    /// Total time spent in `probe_duration_ms`, so the diagnostics can separate the walk from
    /// the sticks' seeks instead of blaming 「扫描」 as one number.
    probe_ns: u128,
}

/// A file with no group needs a value in `per_file` too, and no group index is valid for it.
const NO_CLIP_GROUP: usize = usize::MAX;
/// Each probe is a few seeks on a stick behind FUSE. R159 added `probe_durations`, which measures
/// an event's clips when it is opened, so the scan no longer has to guess the whole 1.9 TB stick:
/// 200 covers the newest few dozen events (and the first screen/timeline); everything older is
/// measured lazily on open. 2 000 probes was a large share of the USB wait and the stutter.
const MAX_DURATION_PROBES: usize = 200;

impl ClipLengths {
    fn note(&mut self, path: &str) {
        if !path.to_ascii_lowercase().ends_with(".mp4") {
            self.per_file.push(NO_CLIP_GROUP);
            return;
        }
        let key = clip_stamp_key(path);
        let group = match self.by_key.get(&key) {
            Some(&group) => group,
            None => {
                let group = self.groups.len();
                self.groups.push(ClipGroup::default());
                self.by_key.insert(key, group);
                group
            }
        };
        let front = is_front_clip(path);
        let slot = self.groups[group];
        // A front file is worth reading even when another view already answered, because the ruler
        // is the front feed's clock. Without one, the first readable view is all there is.
        let needed = slot.front.is_none() && (front || slot.any.is_none());
        if needed && self.probes < MAX_DURATION_PROBES {
            self.probes += 1;
            let started = std::time::Instant::now();
            if let Some(ms) = mp4_duration::probe_duration_ms(std::path::Path::new(path)) {
                let slot = &mut self.groups[group];
                if front { slot.front = Some(ms); } else { slot.any = Some(ms); }
            }
            self.probe_ns += started.elapsed().as_nanos();
        }
        self.per_file.push(group);
    }

    /// One answer per file, in scan order; 0 for anything this could not measure.
    fn finish(&self) -> Vec<u64> {
        self.per_file.iter().map(|&group| {
            if group == NO_CLIP_GROUP { return 0; }
            let slot = self.groups[group];
            slot.front.or(slot.any).unwrap_or(0)
        }).collect()
    }

    /// R168 — the same answer for one file, for batches that leave the walk before it ends.
    fn duration_at(&self, index: usize) -> u64 {
        let Some(&group) = self.per_file.get(index) else { return 0 };
        if group == NO_CLIP_GROUP { return 0; }
        let slot = self.groups[group];
        slot.front.or(slot.any).unwrap_or(0)
    }
}

#[derive(Default)]
struct ScanFiles {
    files: Vec<String>,
    sizes: Vec<u64>,
    lengths: ClipLengths,
    /// Time spent in `entry.metadata()` and how many media entries asked for it. On an OTG stick
    /// this can be a `stat` per file behind FUSE; the diagnostics split it out from the walk.
    stat_ns: u128,
}

/// R191 — 「这个路径上次多大」。2 TB 那盘 62.5k 个文件的 `metadata()` 在 FUSE 上要 24 s，而 dashcam
/// 的片段写完就不再变：同一个路径还在，尺寸就当它还一样。文件名集合变了（新录一段、删一段）才会
/// 出现新路径，新路径照常 `stat`，扫描结束时整份重写，删掉的那些自然消失。
///
/// 代价说清楚：**同一个路径被就地改写、尺寸变了**这一种情况会读到旧尺寸，直到下一次全量扫描。
/// 车机不会这么做；列表上的体积和「释放了多少」以外没有别的东西依赖这个数。
struct ScanIndex {
    sizes: HashMap<String, u64>,
    /// R194 — 目录 → (它自己的 mtime, 子项名字 + 是不是目录)。`readdir` 才是 1.9 TB 那盘剩下的
    /// 大头（61k 文件 28–44 s，stat 已经不花时间了），而目录 mtime 没变就说明里面没增删。
    /// 复用的代价也算清楚：同一个目录里**换掉一个同尺寸文件**不会改目录 mtime，车机不会这么做；
    /// 删除/新增都会改，下一次扫描自然重读那一个目录。
    listings: HashMap<String, (u64, Vec<(String, bool)>)>,
    /// R199 — 这一份索引是「同一次挂载里写下的、写完之后我们自己也没删过东西」。
    /// 是就完全跳过逐目录 `stat`：安卓上盘是独占挂载，挂载期内不可能被别的设备改写。
    sealed: bool,
    /// 写索引时那块卷的 `st_dev`：重新挂载会换一个，凭它判断「还是不是同一次挂载」。
    dev: Option<u64>,
    file: Option<std::path::PathBuf>,
    reused: usize,
    dirs_reused: usize,
}

/// 卷的设备号。重新挂载（拔插、换盘）会得到新的 superblock，因此值会变。
#[cfg(unix)]
fn volume_dev(path: &str) -> Option<u64> {
    use std::os::unix::fs::MetadataExt;
    std::fs::metadata(path).ok().map(|meta| meta.dev())
}

#[cfg(not(unix))]
fn volume_dev(_path: &str) -> Option<u64> {
    None
}

impl ScanIndex {
    fn empty() -> Self {
        ScanIndex {
            sizes: HashMap::new(),
            listings: HashMap::new(),
            sealed: false,
            dev: None,
            file: None,
            reused: 0,
            dirs_reused: 0,
        }
    }

    fn load(root: &str, allow_sealed: bool) -> Self {
        let Some(dir) = SCAN_INDEX_DIR.get() else {
            return ScanIndex::empty();
        };
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        root.hash(&mut hasher);
        // R194 — 文件名换了：旧文件是「size\tpath」，新文件带记录类型，读串了会把路径当成尺寸。
        let file = dir.join(format!("scan-tree-{:016x}.tsv", hasher.finish()));
        let dev = volume_dev(root);
        let mut index = ScanIndex {
            sizes: HashMap::new(),
            listings: HashMap::new(),
            sealed: false,
            dev,
            file: Some(file.clone()),
            reused: 0,
            dirs_reused: 0,
        };
        let Ok(text) = std::fs::read_to_string(&file) else { return index };
        let mut lines = text.lines();
        // R199 — 头一行 `V<TAB><dev>`；同一次挂载 + 没有脏标记，才允许「不问 mtime 直接信清单」。
        let header_dev = lines
            .next()
            .and_then(|line| line.strip_prefix("V\t"))
            .and_then(|value| value.trim().parse::<u64>().ok());
        index.sealed = allow_sealed
            && !file.with_extension("dirty").exists()
            && header_dev.is_some()
            && header_dev == dev
            && written_within(&file, 10);
        for line in lines {
            let mut parts = line.split('\t');
            match parts.next() {
                Some("F") => {
                    let (Some(size), Some(path)) = (parts.next(), parts.next()) else { continue };
                    if let Ok(size) = size.parse::<u64>() {
                        if !path.is_empty() {
                            index.sizes.insert(path.to_string(), size);
                        }
                    }
                }
                Some("D") => {
                    let (Some(stamp), Some(path)) = (parts.next(), parts.next()) else { continue };
                    let Ok(stamp) = stamp.parse::<u64>() else { continue };
                    let mut names = Vec::new();
                    while let Some(name) = parts.next() {
                        let flag = parts.next().unwrap_or("0");
                        names.push((name.to_string(), flag == "1"));
                    }
                    index.listings.insert(path.to_string(), (stamp, names));
                }
                _ => {}
            }
        }
        index
    }

    /// `wanted == None` 表示「不问 mtime」（同一次挂载内的封存索引）。
    fn listing(&self, dir: &str, wanted: Option<u64>) -> Option<Vec<(String, bool)>> {
        let (cached, names) = self.listings.get(dir)?;
        if let Some(wanted) = wanted {
            if *cached != wanted {
                return None;
            }
        }
        Some(names.clone())
    }

    fn remember_listing(&mut self, dir: &str, stamp: u64, names: Vec<(String, bool)>) {
        self.listings.insert(dir.to_string(), (stamp, names));
    }

    fn lookup(&mut self, path: &str) -> Option<u64> {
        let size = self.sizes.get(path).copied()?;
        self.reused += 1;
        Some(size)
    }

    fn record(&mut self, path: &str, size: u64) {
        self.sizes.insert(path.to_string(), size);
    }

    /// Rewrite the whole file from the scan that just finished. A truncated walk never gets here:
    /// half a list would evict every path it did not reach.
    fn save(&self, files: &[String], sizes: &[u64]) {
        let Some(file) = self.file.as_ref() else { return };
        if files.len() != sizes.len() || files.is_empty() {
            return;
        }
        let mut out = String::with_capacity(files.len() * 48);
        // R199 — 头一行记下写这份索引时的卷设备号；下次挂载对不上就不敢「不问 mtime」。
        out.push_str("V\t");
        out.push_str(&self.dev.unwrap_or(0).to_string());
        out.push('\n');
        for (path, size) in files.iter().zip(sizes.iter()) {
            out.push_str("F\t");
            out.push_str(&size.to_string());
            out.push('\t');
            out.push_str(path);
            out.push('\n');
        }
        for (dir, (stamp, names)) in self.listings.iter() {
            out.push_str("D\t");
            out.push_str(&stamp.to_string());
            out.push('\t');
            out.push_str(dir);
            for (name, is_dir) in names {
                out.push('\t');
                out.push_str(name);
                out.push('\t');
                out.push(if *is_dir { '1' } else { '0' });
            }
            out.push('\n');
        }
        let tmp = file.with_extension("tmp");
        if std::fs::write(&tmp, out).is_ok() {
            if std::fs::rename(&tmp, file).is_ok() {
                // R199 — 这份索引重新覆盖了整棵树，之前的「脏」就不算了。
                let _ = std::fs::remove_file(file.with_extension("dirty"));
            }
        }
    }
}

fn push_media_file(
    path: &str,
    budget: &mut WalkBudget,
    scan: &mut ScanFiles,
    index: &mut ScanIndex,
) {
    if !is_media_file(path) {
        return;
    }
    scan.lengths.note(path);
    let started = std::time::Instant::now();
    let size = match index.lookup(path) {
        Some(size) => size,
        None => {
            let size = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
            index.record(path, size);
            size
        }
    };
    scan.stat_ns += started.elapsed().as_nanos();
    scan.files.push(path.to_string());
    scan.sizes.push(size);
    budget.files += 1;
    // R159: the page polls this while the walk runs; see `scan_progress`.
    SCAN_FILES_SEEN.fetch_add(1, Ordering::Relaxed);
}

/// R194 — 一个子项，只带遍历需要的三样:路径、名字（排序用）、是不是目录。
struct Child {
    path: String,
    name: String,
    is_dir: bool,
}

/// 目录自身的 mtime，纳秒。它是「这份子项清单还能不能用」的唯一凭据。
fn dir_stamp(dir: &std::path::Path) -> Option<u64> {
    let modified = std::fs::metadata(dir).ok()?.modified().ok()?;
    Some(modified.duration_since(std::time::UNIX_EPOCH).ok()?.as_nanos() as u64)
}

/// R195 — 这份清单是不是「刚刚还在变」。
///
/// FAT32 的时间戳只有 2 秒精度（实测：增/删文件后目录 mtime 从 :46 走到 :50/:54/:56，全是偶数秒）。
/// 一个目录若在扫描前 2 秒内被改过，紧接着的又一次增删可能落进同一个 2 秒桶、mtime 一字不差，
/// 缓存就会把新文件挡在外面。这类目录这一次先不记账，下一次扫描自然重读它。
fn stamp_is_fresh(stamp: u64) -> bool {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|since| since.as_nanos() as u64)
        .unwrap_or(0);
    // 时间戳在未来（时钟回拨）也按「新鲜」处理：宁可多读一次目录。
    now.saturating_sub(stamp) < 2_500_000_000
}

/// R203 — 这份清单写下到现在过了 `minutes` 分钟以内吗。
///
/// R199 的「同一次挂载里别人不会改盘」只在刚扫过的几分钟里成立：车一直在往 `RecentClips` 写，
/// 文件管理器、电脑（MTP）、`adb push` 都在往同一块盘写，而挂载设备号一个字都没变。实测：
/// 把 `/sdcard/TeslaCamR204` 整个删掉重建成另一种结构，封存索引照样把 900 个早已不存在的路径
/// 交回页面，列表看起来「没变化」。读不到时间（文件被换、时钟回拨）一律按「不新鲜」处理：
/// 宁可多问一次目录 mtime。
fn written_within(file: &std::path::Path, minutes: u64) -> bool {
    file.metadata()
        .and_then(|meta| meta.modified())
        .ok()
        .and_then(|when| when.elapsed().ok())
        .is_some_and(|age| age < std::time::Duration::from_secs(minutes * 60))
}

fn children_of(dir_text: &str, names: Vec<(String, bool)>) -> Vec<Child> {
    names
        .into_iter()
        .map(|(name, is_dir)| Child {
            path: format!("{dir_text}/{name}"),
            name,
            is_dir,
        })
        .collect()
}

/// R194 — 列一个目录的子项，能复用就复用。真机上 2 424 个事件目录的 `readdir` 占了 walk 的
/// 全部时间；缓存命中时这里只剩一次 `stat`（取目录 mtime）。
fn read_children(dir: &std::path::Path, index: &mut ScanIndex) -> Option<Vec<Child>> {
    let dir_text = dir.to_str()?.trim_end_matches('/');
    // R199 — 同一次挂载里写下的索引、之后我们自己也没删过东西：安卓上盘是独占挂载，不可能被
    // 别的设备改写，于是连目录 mtime 都不问（1.9 TB 盘上那是 2 496 次往返，实测 ~10 s）。
    // R203 — 这个前提只在扫描之后的一小会儿里成立（`written_within`），而且用户主动下拉刷新时
    // 干脆不问它：那一下就是「我知道盘上有了新东西，去看」。
    if index.sealed {
        if let Some(names) = index.listing(dir_text, None) {
            index.dirs_reused += 1;
            return Some(children_of(dir_text, names));
        }
    }
    let stamp = dir_stamp(dir)?;
    if !index.sealed {
        if let Some(names) = index.listing(dir_text, Some(stamp)) {
            index.dirs_reused += 1;
            return Some(children_of(dir_text, names));
        }
    }
    let read = std::fs::read_dir(dir).ok()?;
    // Tesla names every event folder and every clip with its timestamp, so a descending name order
    // is a descending time order. When the budget runs out, what survives is the recent end —
    // before this, the surviving set was whatever the filesystem happened to list first.
    let mut entries: Vec<_> = read.flatten().collect();
    entries.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
    let mut children = Vec::with_capacity(entries.len());
    let mut record = Vec::with_capacity(entries.len());
    let mut clean = true;
    for entry in entries {
        let Some(text) = entry.path().to_str().map(str::to_string) else { continue };
        let name = entry.file_name().to_string_lossy().into_owned();
        // A tab or a newline in a name would split the record; such a folder simply is not cached.
        if name.contains('\t') || name.contains('\n') {
            clean = false;
        }
        let is_dir = entry_is_dir(&entry);
        record.push((name.clone(), is_dir));
        children.push(Child { path: text, name, is_dir });
    }
    if clean && !stamp_is_fresh(stamp) {
        index.remember_listing(dir_text, stamp, record);
    }
    Some(children)
}

/// R168 — a chunk of the walk, handed to the page while the rest of the stick is still being read.
///
/// The 1.9 TB stick in the field takes ~2 minutes to walk, and until this existed the list was a
/// skeleton for all of it. Batches are cut from the walk itself, so what arrives first is whatever
/// the walk reached first: `RecentClips` before the older folders, and within each folder the
/// newest event first (`walk_dir` sorts names descending).
#[derive(Clone, Serialize)]
struct ScanBatch {
    scan_id: u64,
    files: Vec<String>,
    sizes: Vec<u64>,
    durations: Vec<u64>,
}

/// How many files go into a batch. The first one is deliberately small — it is what puts the newest
/// events on screen — and the rest are large enough that the bridge is not talking more than the
/// disk ever could.
///
/// R194 — 240 → 60: 1.9 TB 那盘的第一批原本要等 16.5 s，因为走到 240 个文件（≈10 个事件）之前
/// 页面什么都不显示。60 个文件约 2–3 个事件，够填满首屏的最近几行。
const SCAN_FIRST_BATCH_FILES: usize = 60;
const SCAN_BATCH_FILES: usize = 900;

/// The walk does not care who is listening. `NoSink` is the desktop / plain-call path and costs one
/// subtraction per file; `StreamSink` is the phone's progressive scan.
trait ScanSink {
    fn maybe_emit(&mut self, scan: &ScanFiles);
    fn flush(&mut self, scan: &ScanFiles);
}

struct NoSink;

impl ScanSink for NoSink {
    fn maybe_emit(&mut self, _scan: &ScanFiles) {}
    fn flush(&mut self, _scan: &ScanFiles) {}
}

struct StreamSink<'a> {
    app: &'a tauri::AppHandle,
    scan_id: u64,
    emitted: usize,
    first: bool,
}

impl StreamSink<'_> {
    fn emit(&mut self, scan: &ScanFiles) {
        let from = self.emitted;
        let to = scan.files.len();
        if from >= to {
            return;
        }
        let batch = ScanBatch {
            scan_id: self.scan_id,
            files: scan.files[from..to].to_vec(),
            sizes: scan.sizes[from..to].to_vec(),
            durations: (from..to).map(|i| scan.lengths.duration_at(i)).collect(),
        };
        // A page that has already moved on to another folder is allowed to miss a batch; the scan
        // itself must not fail because nobody is listening.
        let _ = self.app.emit("scan-batch", batch);
        self.emitted = to;
    }
}

impl ScanSink for StreamSink<'_> {
    fn maybe_emit(&mut self, scan: &ScanFiles) {
        let target = if self.first { SCAN_FIRST_BATCH_FILES } else { SCAN_BATCH_FILES };
        if scan.files.len().saturating_sub(self.emitted) < target {
            return;
        }
        self.emit(scan);
        self.first = false;
    }

    fn flush(&mut self, scan: &ScanFiles) {
        self.emit(scan);
    }
}

fn walk_dir(
    dir: &std::path::Path,
    depth: usize,
    budget: &mut WalkBudget,
    scan: &mut ScanFiles,
    sink: &mut dyn ScanSink,
    index: &mut ScanIndex,
) {
    if depth == 0 || budget.spent() {
        return;
    }
    let Some(children) = read_children(dir, index) else {
        return;
    };
    budget.dirs += 1;
    for child in children {
        if budget.spent() {
            return;
        }
        if child.is_dir {
            walk_dir(std::path::Path::new(&child.path), depth - 1, budget, scan, sink, index);
        } else {
            push_media_file(&child.path, budget, scan, index);
        }
        // R168 — the check sits after every entry, so a flat RecentClips (tens of thousands of
        // files in one folder) streams exactly like the timestamp-folder layout does.
        sink.maybe_emit(scan);
    }
}

/// What one walk of a folder produced, and whether the budget cut it short. The second half is
/// the point: a 2 TB drive with a hundred thousand clips returns exactly the same list shape at
/// 20 000 files as an empty folder returns at zero, and without the flag the app has to call a
/// partial scan complete.
#[derive(Clone, Serialize)]
struct ScanReport {
    files: Vec<String>,
    /// Byte length of each entry in `files`, same order, same length. A parallel array rather than a
    /// struct per file so every reader that only wants paths — the desktop scan, the folder browser —
    /// keeps working untouched.
    sizes: Vec<u64>,
    /// Measured length of each entry in milliseconds, same order, 0 where it could not be read.
    /// Another parallel array for the same reason: the desktop scan has no such column and must
    /// not start paying for it, but the phone's timeline can stop inventing 60 s clips.
    durations: Vec<u64>,
    truncated: bool,
    /// R167 — the diagnostics need to say where a 73k-file USB scan spent its time: the walk
    /// itself, the per-file metadata, or the `mvhd` probes. Milliseconds, measured in Rust so the
    /// JS wall time can be compared against the native share.
    total_ms: u64,
    stat_ms: u64,
    probe_ms: u64,
    probes: usize,
    /// R191 — how many sizes came from the index instead of a `stat`. The diagnostics compare this
    /// against `files` to prove the second scan of a stick really skipped the per-file metadata.
    stats_skipped: usize,
    /// R194 — 这次遍历看了多少目录、其中多少份清单是缓存直接给的。
    dirs_seen: usize,
    dirs_cached: usize,
    /// R199 — 走的是「同一次挂载、没删过东西」的封存路径（不问目录 mtime）。
    sealed: bool,
}

fn scan_entry(
    child: &Child,
    depth: usize,
    budget: &mut WalkBudget,
    scan: &mut ScanFiles,
    sink: &mut dyn ScanSink,
    index: &mut ScanIndex,
) {
    if child.is_dir {
        walk_dir(std::path::Path::new(&child.path), depth, budget, scan, sink, index);
    } else {
        push_media_file(&child.path, budget, scan, index);
    }
}

/// R168 — the newest event of the stick, not the newest event of `RecentClips`.
///
/// The three folders were walked one after another (Recent → Saved → Sentry), which put every
/// Sentry event behind every Saved clip even when the Sentry one happened an hour ago. The phone
/// now draws what it has walked, so that order is visible: a 2-minute walk showed minutes-old
/// driving and hours-old sentry. Tesla names both event folders and flat clips with their
/// timestamp, so sorting the three folder listings against each other by name and walking the
/// winner is a true newest-first order. The file budget follows the same order, which also means a
/// truncated scan keeps the newest clips across all three folders.
fn scan_categories(
    mut groups: Vec<Vec<Child>>,
    budget: &mut WalkBudget,
    scan: &mut ScanFiles,
    sink: &mut dyn ScanSink,
    index: &mut ScanIndex,
) {
    groups.sort_by(|a, b| {
        let head = |g: &Vec<Child>| g.first().map(|c| c.name.clone());
        head(b).cmp(&head(a))
    });
    let mut queues: Vec<std::vec::IntoIter<Child>> =
        groups.into_iter().map(Vec::into_iter).collect();
    let mut heads: Vec<Option<Child>> = queues.iter_mut().map(|q| q.next()).collect();
    loop {
        if budget.spent() {
            return;
        }
        let mut best: Option<usize> = None;
        for (i, head) in heads.iter().enumerate() {
            let Some(child) = head else { continue };
            let take = match best {
                None => true,
                Some(b) => child.name.as_str() > heads[b].as_ref().unwrap().name.as_str(),
            };
            if take {
                best = Some(i);
            }
        }
        let Some(i) = best else { return };
        let child = heads[i].take().expect("head was present");
        scan_entry(&child, MAX_SCAN_DEPTH - 1, budget, scan, sink, index);
        sink.maybe_emit(scan);
        heads[i] = queues[i].next();
    }
}

fn scan_tree(path: &str) -> Result<ScanReport, String> {
    scan_tree_with(path, None, true)
}

/// `stream` is the phone's progressive scan: the same walk, the same budgets, the same report, but
/// every few hundred files are also emitted as a `scan-batch` event so the list can fill in.
///
/// `allow_sealed` is R203's 「这次可以偷懒吗」：只有页面自己刷（开机恢复、切 chip）才允许用封存索引
/// 代替目录 mtime。用户下拉刷新、插盘广播那些「盘上确实变了」的现场必须去问。
fn scan_tree_with(
    path: &str,
    stream: Option<(&tauri::AppHandle, u64)>,
    allow_sealed: bool,
) -> Result<ScanReport, String> {
    let started = std::time::Instant::now();
    let root = std::path::Path::new(path);
    // Only the top level failing is an error — that is what distinguishes 「the folder moved
    // away」 from 「one subfolder on the stick is unreadable」.
    let top = std::fs::read_dir(root).map_err(|e| format!("{path}: {e}"))?;

    let mut scan = ScanFiles::default();
    let mut budget = WalkBudget::default();
    // R191 — only the phone's streaming scan keeps a stat index; the desktop scan reads local
    // disks where a `stat` costs nothing and a stale size would just be a wrong number in a list.
    let indexing = stream.is_some();
    let mut index = if indexing { ScanIndex::load(path, allow_sealed) } else { ScanIndex::empty() };
    let mut top: Vec<_> = top.flatten().collect();
    top.sort_by_key(|entry| category_rank(&entry.file_name().to_string_lossy()));
    // R168: the three TeslaCam folders are merged by their children's names; anything else keeps
    // the old "walk it after them" behaviour.
    let mut groups: Vec<Vec<Child>> = Vec::new();
    let mut rest: Vec<std::fs::DirEntry> = Vec::new();
    for entry in top {
        if category_rank(&entry.file_name().to_string_lossy()) < CATEGORY_ORDER.len()
            && entry_is_dir(&entry)
        {
            // R194 — 这三个目录本身也走缓存：真机上它们各自装着几百上千个事件目录。
            let Some(children) = read_children(&entry.path(), &mut index) else { continue };
            budget.dirs += 1;
            groups.push(children);
        } else {
            rest.push(entry);
        }
    }
    let mut plain = NoSink;
    let mut stream_sink = stream.map(|(app, scan_id)| StreamSink {
        app,
        scan_id,
        emitted: 0,
        first: true,
    });
    let sink: &mut dyn ScanSink = match stream_sink.as_mut() {
        Some(sink) => sink,
        None => &mut plain,
    };
    scan_categories(groups, &mut budget, &mut scan, sink, &mut index);
    for entry in rest {
        if budget.spent() {
            break;
        }
        if entry_is_dir(&entry) {
            walk_dir(&entry.path(), MAX_SCAN_DEPTH, &mut budget, &mut scan, sink, &mut index);
        } else if let Some(text) = entry.path().to_str().map(str::to_string) {
            push_media_file(&text, &mut budget, &mut scan, &mut index);
        }
        sink.maybe_emit(&scan);
    }
    sink.flush(&scan);
    let durations = scan.lengths.finish();
    let total_ms = started.elapsed().as_millis() as u64;
    let stat_ms = (scan.stat_ns / 1_000_000) as u64;
    let probe_ms = (scan.lengths.probe_ns / 1_000_000) as u64;
    let probes = scan.lengths.probes;
    let truncated = budget.spent();
    let stats_skipped = index.reused;
    // R194 — 目录清单的命中率是这套缓存唯一的外部证据，诊断里要看得见。
    let dirs_cached = index.dirs_reused;
    let dirs_seen = budget.dirs;
    if indexing && !truncated {
        index.save(&scan.files, &scan.sizes);
    }
    Ok(ScanReport {
        files: scan.files,
        sizes: scan.sizes,
        durations,
        truncated,
        total_ms,
        stat_ms,
        probe_ms,
        probes,
        stats_skipped,
        dirs_seen,
        dirs_cached,
        sealed: index.sealed,
    })
}

#[derive(Clone, Serialize)]
struct ScanProgress {
    files: usize,
    running: bool,
}

/// R159 — how far the walk has got. A 1.9 TB stick is tens of thousands of entries and the page
/// has nothing to show until the whole walk returns; this lets the skeleton count instead of
/// pretending the app is wedged. Cheap enough to poll twice a second.
#[tauri::command]
fn scan_progress() -> ScanProgress {
    ScanProgress {
        files: SCAN_FILES_SEEN.load(Ordering::Relaxed),
        running: SCAN_RUNNING.load(Ordering::Relaxed),
    }
}

#[tauri::command]
async fn scan_media_dir(path: String) -> Result<ScanReport, String> {
    let root = path.clone();
    SCAN_FILES_SEEN.store(0, Ordering::Relaxed);
    SCAN_RUNNING.store(true, Ordering::Relaxed);
    let result = blocking(move || scan_tree(&path)).await;
    SCAN_RUNNING.store(false, Ordering::Relaxed);
    let report = result?;
    // The loopback media server serves exactly the folder the user just opened. Registering it
    // here (not in JS) keeps the boundary in one place and covers every entry point — restored
    // folder, recent chip, USB — because all of them go through this scan.
    stream_server::set_allowed_roots(vec![root]);
    Ok(report)
}

/// R168 — the same scan as `scan_media_dir`, but it reports the walk as it happens.
///
/// The return value is the identical `ScanReport`, so the caller keeps its existing final build and
/// the batches are only a preview: nothing downstream has to decide which of the two is true.
#[tauri::command]
async fn scan_media_dir_stream(
    app: tauri::AppHandle,
    path: String,
    scan_id: u64,
    refresh: Option<bool>,
) -> Result<ScanReport, String> {
    let root = path.clone();
    let allow_sealed = refresh != Some(true);
    LATEST_SCAN_ID.store(scan_id, Ordering::Relaxed);
    SCAN_FILES_SEEN.store(0, Ordering::Relaxed);
    SCAN_RUNNING.store(true, Ordering::Relaxed);
    // The preview draws `thumb.png` and can start a clip while the walk is still running, so the
    // media server has to know this root before the first batch lands. Registering it after the
    // walk (what `scan_media_dir` does) made every preview image a 403.
    let previous_roots = stream_server::get_allowed_roots();
    stream_server::set_allowed_roots(vec![root.clone()]);
    let result = blocking(move || scan_tree_with(&path, Some((&app, scan_id)), allow_sealed)).await;
    SCAN_RUNNING.store(false, Ordering::Relaxed);
    let report = match result {
        Ok(report) => report,
        Err(e) => {
            // R205 — 这个目录连顶层 `read_dir` 都没过（拔了、路径打错了），白名单就不能留在
            // 「只有它」上：屏幕上是上一个目录的列表，播放器要的还是它的文件。
            if LATEST_SCAN_ID.load(Ordering::Relaxed) == scan_id {
                stream_server::set_allowed_roots(previous_roots);
            }
            return Err(e);
        }
    };
    if LATEST_SCAN_ID.load(Ordering::Relaxed) == scan_id {
        stream_server::set_allowed_roots(vec![root]);
    }
    Ok(report)
}

/// R159 — durations for the clips of one event, asked lazily when that event is opened.
///
/// The scan measures the newest minutes only (its probe budget), so on a full stick most Sentry
/// events still fall back to 60 s. Reading `mvhd` is three seeks and a few KB — far cheaper than
/// loading a `<video>` for metadata — so an event can answer for its own clips in milliseconds.
/// 0 means "could not read"; the caller keeps its fallback for that clip.
#[tauri::command]
async fn probe_durations(paths: Vec<String>) -> Result<Vec<u64>, String> {
    let paths = if paths.len() > 300 { paths[..300].to_vec() } else { paths };
    blocking(move || {
        Ok(paths
            .iter()
            .map(|path| {
                mp4_duration::probe_duration_ms(std::path::Path::new(path)).unwrap_or(0)
            })
            .collect::<Vec<u64>>())
    })
    .await
}

/// R160 — the sidecars of one scan, read and parsed in one call.
///
/// The JS path reads the 3 000 `event.json` files of a full stick through the loopback server six
/// at a time before it can draw the list; that is 3 000 round trips for files of a few hundred
/// bytes. This runs the same reads off the UI thread and answers a parallel array, one entry per
/// path, so the caller keeps its existing "which sidecar failed" accounting.
#[derive(Serialize, Default)]
struct SidecarRead {
    ok: bool,
    city: Option<String>,
    street: Option<String>,
    /// Kept verbatim: firmware writes this as a string on some cars and as epoch seconds on
    /// others, and the JS side already normalises both for the trigger offset.
    timestamp: Option<serde_json::Value>,
    lat: Option<f64>,
    lon: Option<f64>,
    reason: Option<String>,
    /// R205 — 为什么这份没读（现在只有「大到不合理」一种）。不能只回一个空的 `ok:false`：
    /// 那和「这个事件根本没有 sidecar」长得一模一样，谁都不会去查第二遍。
    skipped: Option<String>,
}

fn sidecar_string(value: &serde_json::Value, key: &str) -> Option<String> {
    value.get(key).and_then(|item| item.as_str()).map(str::to_owned)
}

/// Tesla writes `est_lat` / `est_lon` as **strings** on the real stick (3167/3167 in the R157
/// audit). Accepting only JSON numbers silently erased every location from the phone UI.
fn sidecar_number(value: &serde_json::Value, key: &str) -> Option<f64> {
    let item = value.get(key)?;
    if let Some(number) = item.as_f64() {
        return Some(number);
    }
    item.as_str().and_then(|text| text.trim().parse::<f64>().ok())
}

fn parse_sidecar(text: &str) -> Option<SidecarRead> {
    let value: serde_json::Value = serde_json::from_str(text).ok()?;
    Some(SidecarRead {
        ok: true,
        city: sidecar_string(&value, "city"),
        street: sidecar_string(&value, "street"),
        timestamp: value.get("timestamp").cloned(),
        lat: sidecar_number(&value, "est_lat"),
        lon: sidecar_number(&value, "est_lon"),
        reason: sidecar_string(&value, "reason"),
        skipped: None,
    })
}

/// R205 — `event.json` 是几 KB 的小文件，读它的命令一次拿 500 个路径。一块被别的设备写坏、
/// 或者根本就是别人家的日志的盘，可以在这儿塞进几百 MB：`read_to_string` 没有上限就是
/// 整份进内存，安卓直接 abort 掉进程。同一类上限在 SEI（32 MB `moov`）那里已经加过了。
const MAX_SIDECAR_BYTES: u64 = 4 * 1024 * 1024;

#[tauri::command]
async fn read_sidecars(paths: Vec<String>) -> Result<Vec<SidecarRead>, String> {
    blocking(move || {
        Ok(paths
            .iter()
            .map(|path| match std::fs::metadata(path) {
                Ok(meta) if meta.len() > MAX_SIDECAR_BYTES => SidecarRead {
                    skipped: Some("tooBig".to_string()),
                    ..Default::default()
                },
                _ => std::fs::read_to_string(path)
                    .ok()
                    .and_then(|text| parse_sidecar(&text))
                    .unwrap_or_default(),
            })
            .collect::<Vec<SidecarRead>>())
    })
    .await
}

/// R199 — 我们自己在这块盘上删过东西。目录清单缓存不再可「不问 mtime 直接用」，
/// 下一次扫描退回逐目录校验，扫完再重新封存。
#[tauri::command]
fn scan_index_dirty(path: String) -> bool {
    let Some(dir) = SCAN_INDEX_DIR.get() else { return false };
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    path.hash(&mut hasher);
    let file = dir.join(format!("scan-tree-{:016x}.tsv", hasher.finish()));
    if !file.exists() {
        return false;
    }
    std::fs::write(file.with_extension("dirty"), b"1").is_ok()
}

/// Directory names one level below `path`, for the in-app folder browser. Kept native for
/// the same reason as `scan_media_dir`: the JS fs plugin gates every call through its own
/// path scope, and a rejection there is invisible to the user.
#[tauri::command]
async fn list_subdirs(path: String) -> Result<Vec<String>, String> {
    blocking(move || {
        let entries = std::fs::read_dir(&path).map_err(|e| format!("{path}: {e}"))?;

        let mut dirs: Vec<String> = entries
            .flatten()
            .filter(|entry| entry_is_dir(entry))
            .filter_map(|entry| entry.file_name().into_string().ok())
            .collect();
        dirs.sort();
        Ok(dirs)
    })
    .await
}

/// SEI telemetry for one MP4, walked on the file handle instead of through the loopback media
/// server. The JS parser has to see every video NAL to count frames, so it cannot work from a
/// range request and ends up downloading the whole segment — 50.9 MB and 2.5 s for one `front`
/// clip — to produce the 120 KB of payloads this returns. Protobuf decoding stays in JS.
#[tauri::command]
async fn read_sei_metadata(path: String) -> Result<Vec<SeiSample>, String> {
    blocking(move || sei_reader::read_sei(&path)).await
}

/// Run a filesystem walk off the main thread. A synchronous `#[tauri::command]` executes on
/// the UI thread on Android, so anything that touches a stick — where one `read_dir` can take
/// a second — is an invisible freeze there, and an ANR dialog if it lasts long enough.
fn blocking<T>(work: impl FnOnce() -> Result<T, String> + Send + 'static) -> impl std::future::Future<Output = Result<T, String>>
where
    T: Send + 'static,
{
    async move {
        tauri::async_runtime::spawn_blocking(work)
            .await
            .unwrap_or_else(|e| Err(format!("task failed: {e}")))
    }
}

#[derive(Clone, Serialize)]
struct MediaLocation {
    path: String,
    videos: usize,
    teslacam: bool,
}

const CLIP_DIRS: [&str; 3] = ["RecentClips", "SavedClips", "SentryClips"];
const MAX_LOCATIONS: usize = 12;
/// Enough directories to cover a phone's shared storage, few enough that the search
/// never turns into the thing the user is waiting on.
const MAX_SEARCH_DIRS: i32 = 400;

/// The three folder names that only a TeslaCam root has. Checked against the names the walk
/// already read out of the directory, not with a `join().is_dir()` each — on a stick behind FUSE
/// that is three `stat` calls per folder visited, per pass, for a lookup readdir already answered.
fn clip_folder(names: &[String]) -> bool {
    CLIP_DIRS
        .iter()
        .any(|name| names.iter().any(|dir| dir == &name.to_ascii_lowercase()))
}

fn dir_name(dir: &std::path::Path) -> String {
    dir.file_name()
        .map(|name| name.to_string_lossy().to_lowercase())
        .unwrap_or_default()
}

fn worth_visiting(dir: &std::path::Path) -> bool {
    let name = dir_name(dir);
    !name.starts_with('.') && name != "lost+found" && name != "android"
}

fn note_location(dir: &std::path::Path, depth: usize, budget: &mut i32, out: &mut Vec<MediaLocation>) {
    if depth == 0 || *budget <= 0 || out.len() >= MAX_LOCATIONS {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    *budget -= 1;

    let mut videos = 0;
    let mut subdirs = Vec::new();
    for entry in entries.flatten() {
        if entry_is_dir(&entry) {
            subdirs.push(entry.path());
        } else if entry
            .file_name()
            .to_string_lossy()
            .to_ascii_lowercase()
            .ends_with(".mp4")
        {
            videos += 1;
        }
    }

    let teslacam = dir_name(dir) == "teslacam"
        || clip_folder(
            &subdirs
                .iter()
                .map(|sub| dir_name(sub))
                .collect::<Vec<_>>(),
        );
    if videos > 0 || teslacam {
        if let Some(text) = dir.to_str() {
            out.push(MediaLocation {
                path: text.to_string(),
                videos,
                teslacam,
            });
        }
    }

    for sub in subdirs {
        if worth_visiting(&sub) {
            note_location(&sub, depth - 1, budget, out);
        }
    }
}

fn storage_volumes() -> Vec<std::path::PathBuf> {
    let mut volumes = vec![std::path::PathBuf::from(SHARED_ROOT)];
    let Ok(entries) = std::fs::read_dir("/storage") else {
        return volumes;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = dir_name(&path);
        if !entry_is_dir(&entry) || matches!(name.as_str(), "emulated" | "self" | "users" | "") {
            continue;
        }
        volumes.push(path);
    }
    volumes
}

/// "This folder is empty" has two very different causes — nothing was copied there, or
/// All Files Access is off and Android hands back an empty listing instead of EACCES.
/// Saying where clips actually live on the device settles it without another round trip.
#[tauri::command]
async fn find_media_locations(app: tauri::AppHandle) -> Vec<MediaLocation> {
    // Only the identifier is needed from the handle, so it is read here rather than moving the
    // handle onto the worker: the search below is the part that must not run on the UI thread.
    let app_files_dir = format!("{SHARED_ROOT}/Android/data/{}/files", app.config().identifier);

    blocking(move || {
        let mut budget = MAX_SEARCH_DIRS;
        let mut out = Vec::new();

        // The app-private directory is skipped by the generic walk (Android/data is other apps'
        // sandbox), so probe it directly: it is the permission-free place to put TeslaCam.
        note_location(std::path::Path::new(&app_files_dir), 6, &mut budget, &mut out);
        for volume in storage_volumes() {
            note_location(&volume, 3, &mut budget, &mut out);
        }

        out.sort_by(|a, b| b.videos.cmp(&a.videos));
        out.truncate(MAX_LOCATIONS);
        Ok(out)
    })
    .await
    .unwrap_or_default()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // mut is only consumed by the desktop branch below.
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // R191 — the stat index lives in the app's own cache dir: it is a speed-up, not data,
            // and the system may clear it whenever it likes.
            use tauri::Manager;
            if let Ok(dir) = app.path().app_cache_dir() {
                let _ = std::fs::create_dir_all(&dir);
                let _ = SCAN_INDEX_DIR.set(dir);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            write_binary_file,
            ensure_media_server,
            probe_readable,
            storage_status,
            scan_media_dir,
            scan_media_dir_stream,
            scan_progress,
            probe_durations,
            read_sidecars,
            list_subdirs,
            read_sei_metadata,
            find_media_locations,
            scan_index_dirty
        ]);

    // dialog and shell plugins do not ship mobile implementations.
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder
            .plugin(tauri_plugin_dialog::init())
            .plugin(tauri_plugin_shell::init());
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

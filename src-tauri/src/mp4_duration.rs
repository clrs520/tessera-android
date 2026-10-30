//! Reads the movie duration out of an MP4 without decoding it.
//!
//! The web layer books every clip at 60 s and measures only the last one, because the desktop
//! never had anything better. A phone scan does: it already holds every path, and Tesla writes
//! ordinary MP4s whose `moov` ends the file. `mvhd` is the first child of that `moov`, so this
//! costs a few seeks and a few kilobytes per minute — and turns the timeline (start times,
//! seeking, filmstrip, speed curve, export window) from "assume a minute" into what the files
//! really hold. A real 2026 stick starts at 20.6 s and rolls at 59.5–62.9 s.

use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

/// `mvhd` sits at the head of `moov`; reading further is only for files that reorder children.
const MOOV_HEAD_LIMIT: u64 = 64 * 1024;
/// Top-level boxes in a normal MP4 are ftyp/free/mdat/moov — anything past this is not one.
const MAX_BOXES: usize = 512;
/// A dashcam clip is a minute; anything past a day is a misread size field, not a video.
const MAX_CLIP_MS: u64 = 24 * 60 * 60 * 1000;

pub(crate) fn probe_duration_ms(path: &Path) -> Option<u64> {
    let mut file = std::fs::File::open(path).ok()?;
    let total = file.metadata().ok()?.len();
    let (moov_start, moov_len) = find_box(&mut file, b"moov", 0, total)?;
    let head = read_at(&mut file, moov_start, moov_len.min(MOOV_HEAD_LIMIT))?;
    let (start, len) = find_box_in(&head, b"mvhd")?;
    parse_mvhd(&head, start, len)
}

/// Walks the boxes in `[from, end)` and answers the first body of `want`.
fn find_box(file: &mut std::fs::File, want: &[u8; 4], from: u64, end: u64) -> Option<(u64, u64)> {
    let mut pos = from;
    for _ in 0..MAX_BOXES {
        if pos + 8 > end {
            return None;
        }
        let mut head = [0u8; 16];
        file.seek(SeekFrom::Start(pos)).ok()?;
        file.read_exact(&mut head[..8]).ok()?;
        let mut size = u32::from_be_bytes([head[0], head[1], head[2], head[3]]) as u64;
        let kind = [head[4], head[5], head[6], head[7]];
        let mut header = 8;
        if size == 1 {
            file.read_exact(&mut head[8..16]).ok()?;
            size = u64::from_be_bytes([
                head[8], head[9], head[10], head[11], head[12], head[13], head[14], head[15],
            ]);
            header = 16;
        } else if size == 0 {
            size = end - pos;
        }
        // A size that walks backwards or out of the file is a corrupt header, not a box to skip.
        if size < header || pos.checked_add(size)? > end {
            return None;
        }
        if &kind == want {
            return Some((pos + header, size - header));
        }
        pos += size;
    }
    None
}

/// Same walk over a buffer already in memory (the children of `moov`).
fn find_box_in(data: &[u8], want: &[u8; 4]) -> Option<(usize, usize)> {
    let mut pos = 0usize;
    for _ in 0..MAX_BOXES {
        let head = data.get(pos..pos + 8)?;
        let mut size = u32::from_be_bytes([head[0], head[1], head[2], head[3]]) as u64;
        let kind = [head[4], head[5], head[6], head[7]];
        let mut header = 8u64;
        if size == 1 {
            let large = data.get(pos + 8..pos + 16)?;
            size = u64::from_be_bytes([
                large[0], large[1], large[2], large[3], large[4], large[5], large[6], large[7],
            ]);
            header = 16;
        } else if size == 0 {
            size = (data.len() - pos) as u64;
        }
        if size < header {
            return None;
        }
        let body = pos + header as usize;
        let end = pos + usize::try_from(size).ok()?;
        if end > data.len() {
            return None;
        }
        if &kind == want {
            return Some((body, end - body));
        }
        pos = end;
    }
    None
}

fn read_at(file: &mut std::fs::File, start: u64, len: u64) -> Option<Vec<u8>> {
    let mut buf = vec![0u8; usize::try_from(len).ok()?];
    file.seek(SeekFrom::Start(start)).ok()?;
    file.read_exact(&mut buf).ok()?;
    Some(buf)
}

/// `mvhd` body: version, flags, two dates, timescale, duration — either 32 or 64 bits wide.
fn parse_mvhd(data: &[u8], start: usize, len: usize) -> Option<u64> {
    let body = data.get(start..start.checked_add(len)?)?;
    match *body.first()? {
        1 => {
            let timescale = be32(body.get(20..24)?)? as u64;
            let duration = be64(body.get(24..32)?)?;
            finish(timescale, duration)
        }
        _ => {
            let timescale = be32(body.get(12..16)?)? as u64;
            let duration = be32(body.get(16..20)?)? as u64;
            finish(timescale, duration)
        }
    }
}

fn finish(timescale: u64, duration: u64) -> Option<u64> {
    // `0` is "unknown" and all-ones is "unknown" in both widths; a zero timescale is a divide by
    // zero. All three are files this cannot answer for, not files that are 0 ms long.
    if timescale == 0 || duration == 0 || duration == u32::MAX as u64 || duration == u64::MAX {
        return None;
    }
    let ms = duration.saturating_mul(1000) / timescale;
    if ms == 0 || ms > MAX_CLIP_MS {
        return None;
    }
    Some(ms)
}

fn be32(bytes: &[u8]) -> Option<u32> {
    Some(u32::from_be_bytes(bytes.get(..4)?.try_into().ok()?))
}

fn be64(bytes: &[u8]) -> Option<u64> {
    Some(u64::from_be_bytes(bytes.get(..8)?.try_into().ok()?))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn box_bytes(kind: &[u8; 4], body: &[u8]) -> Vec<u8> {
        let mut out = Vec::new();
        out.extend_from_slice(&((body.len() + 8) as u32).to_be_bytes());
        out.extend_from_slice(kind);
        out.extend_from_slice(body);
        out
    }

    fn mvhd(version: u8, timescale: u32, duration: u64) -> Vec<u8> {
        let mut body = vec![version, 0, 0, 0];
        if version == 1 {
            body.extend_from_slice(&[0u8; 16]);
            body.extend_from_slice(&timescale.to_be_bytes());
            body.extend_from_slice(&duration.to_be_bytes());
        } else {
            body.extend_from_slice(&[0u8; 8]);
            body.extend_from_slice(&timescale.to_be_bytes());
            body.extend_from_slice(&(duration as u32).to_be_bytes());
        }
        body
    }

    #[test]
    fn reads_v0_and_v1_movie_headers() {
        let v0 = box_bytes(b"moov", &box_bytes(b"mvhd", &mvhd(0, 10_000, 206_270)));
        let (start, len) = find_box_in(&v0[8..], b"mvhd").unwrap();
        assert_eq!(parse_mvhd(&v0[8..], start, len), Some(20_627));

        let v1 = box_bytes(b"moov", &box_bytes(b"mvhd", &mvhd(1, 10_000, 616_100)));
        let (start, len) = find_box_in(&v1[8..], b"mvhd").unwrap();
        assert_eq!(parse_mvhd(&v1[8..], start, len), Some(61_610));
    }

    #[test]
    fn unknown_lengths_are_not_zero() {
        assert_eq!(finish(10_000, 0), None);
        assert_eq!(finish(0, 60_000), None);
        assert_eq!(finish(10_000, u32::MAX as u64), None);
        assert_eq!(finish(10_000, 600_000), Some(60_000));
    }

    #[test]
    fn walks_past_a_huge_mdat_without_reading_it() {
        let dir = std::env::temp_dir().join("tessera-mp4-duration-test");
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("clip.mp4");
        let mut file = Vec::new();
        file.extend_from_slice(&box_bytes(b"ftyp", &[0u8; 16]));
        // A `size` field claiming this much without the bytes to back it is exactly the shape of a
        // file still being written; the reader must answer "unknown" instead of seeking to it.
        file.extend_from_slice(&((2u32 << 20) as u32).to_be_bytes());
        file.extend_from_slice(b"mdat");
        file.extend_from_slice(&[0u8; 32]);
        let moov = box_bytes(b"moov", &box_bytes(b"mvhd", &mvhd(0, 10_000, 599_820)));
        file.extend_from_slice(&moov);
        std::fs::write(&path, &file).unwrap();
        assert_eq!(probe_duration_ms(&path), None);

        // The same file with the `mdat` body actually present answers 59.982 s.
        let mut complete = Vec::new();
        complete.extend_from_slice(&box_bytes(b"ftyp", &[0u8; 16]));
        let mut big = vec![0u8; 4096];
        big[..4].copy_from_slice(&4096u32.to_be_bytes());
        big[4..8].copy_from_slice(b"mdat");
        complete.extend_from_slice(&big);
        complete.extend_from_slice(&moov);
        std::fs::write(&path, &complete).unwrap();
        assert_eq!(probe_duration_ms(&path), Some(59_982));
        let _ = std::fs::remove_dir_all(&dir);
    }
}

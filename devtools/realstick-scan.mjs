// R157 — statistics over a complete TeslaCam stick (D:\TeslaCam).
// Reads names for everything, `event.json` / `thumb.png` for every event, and the MP4 `moov`
// for a sample of minutes. Output is aggregate only: counts, seconds, sizes. No paths, no
// addresses, no plate data leaves this process.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] || 'D:/TeslaCam';

async function listDir(dir) {
    try { return await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
}

// ---- MP4 moov/mvhd ---------------------------------------------------------
async function readAt(fh, pos, len) {
    const buf = Buffer.alloc(len);
    const { bytesRead } = await fh.read(buf, 0, len, pos);
    return buf.subarray(0, bytesRead);
}

function boxAt(buf, pos, total) {
    if (pos + 8 > buf.length) return null;
    let size = buf.readUInt32BE(pos);
    const kind = buf.toString('latin1', pos + 4, pos + 8);
    let header = 8;
    if (size === 1) {
        if (pos + 16 > buf.length) return null;
        size = Number(buf.readBigUInt64BE(pos + 8));
        header = 16;
    } else if (size === 0) {
        size = total - pos;
    }
    if (size < header || pos + size > total) return null;
    return { size, kind, header, end: pos + size };
}

async function mp4Info(file) {
    let fh;
    try {
        fh = await fs.open(file, 'r');
        const { size: total } = await fh.stat();
        let pos = 0;
        for (let i = 0; i < 512 && pos + 8 <= total; i += 1) {
            const head = await readAt(fh, pos, 16);
            const b = boxAt(head, 0, total);
            if (!b) return null;
            if (b.kind === 'moov') {
                const body = b.size - b.header;
                const data = await readAt(fh, pos + b.header, Math.min(body, 64 * 1024));
                let mvhd = null;
                for (let p = 0; p + 8 <= data.length;) {
                    const c = boxAt(data, p, data.length);
                    if (!c) break;
                    if (c.kind === 'mvhd') { mvhd = { start: p + c.header, len: c.size - c.header }; break; }
                    p = c.end;
                }
                if (!mvhd) return null;
                const v = data[mvhd.start];
                const ts = v === 1 ? data.readUInt32BE(mvhd.start + 20) : data.readUInt32BE(mvhd.start + 12);
                const dur = v === 1 ? Number(data.readBigUInt64BE(mvhd.start + 24)) : data.readUInt32BE(mvhd.start + 16);
                if (!ts || !dur || dur === 0xffffffff) return null;
                return { seconds: dur / ts, bytes: total };
            }
            pos += b.size;
        }
        return null;
    } catch { return null; } finally { await fh?.close().catch(() => {}); }
}

// First video sample entry of the sample description, for codec/size/rotation.
async function trackInfo(file) {
    let fh;
    try {
        fh = await fs.open(file, 'r');
        const { size: total } = await fh.stat();
        let pos = 0;
        for (let i = 0; i < 512 && pos + 8 <= total; i += 1) {
            const b = boxAt(await readAt(fh, pos, 16), 0, total);
            if (!b) return null;
            if (b.kind === 'moov') {
                const data = await readAt(fh, pos + b.header, Math.min(b.size - b.header, 8 * 1024 * 1024));
                const idx = data.indexOf(Buffer.from('trak'));
                const stsd = data.indexOf(Buffer.from('stsd'));
                if (stsd < 0) return null;
                const fourcc = data.toString('latin1', stsd + 16, stsd + 20);
                const w = data.readUInt16BE(stsd + 44);
                const h = data.readUInt16BE(stsd + 46);
                const tkhd = data.indexOf(Buffer.from('tkhd'));
                let rotation = 0;
                if (tkhd >= 0) {
                    const version = data[tkhd + 4];
                    const base = tkhd - 4 + (version === 1 ? 60 : 48);
                    const a = data.readInt32BE(base) / 65536;
                    const bb = data.readInt32BE(base + 4) / 65536;
                    rotation = Math.round(Math.atan2(bb, a) * 180 / Math.PI);
                }
                return { fourcc, w, h, rotation, hasAudio: data.includes(Buffer.from('mp4a')), trak: idx >= 0 };
            }
            pos += b.size;
        }
        return null;
    } catch { return null; } finally { await fh?.close().catch(() => {}); }
}

// ---- name parsing ----------------------------------------------------------
const CAMERAS = ['front', 'back', 'left_repeater', 'right_repeater', 'left_pillar', 'right_pillar'];
const NAME = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-(front|back|left_repeater|right_repeater|left_pillar|right_pillar)\.mp4$/;
const MINUTE = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2})-\d{2}$/;

function parseName(name) {
    const m = NAME.exec(name);
    if (!m) return null;
    return { stamp: m[1], minute: m[1].slice(0, 16), camera: m[2] };
}

async function pngSize(file) {
    try {
        const fh = await fs.open(file, 'r');
        const b = Buffer.alloc(33);
        await fh.read(b, 0, 33, 0);
        await fh.close();
        if (b.toString('latin1', 12, 16) !== 'IHDR') return null;
        return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
    } catch { return null; }
}

function bump(map, key) { map.set(key, (map.get(key) || 0) + 1); }

// ---- walk ------------------------------------------------------------------
const stats = {
    root: path.basename(ROOT),
    categories: {},
    cameras: new Map(),
    minutes: { total: 0, complete6: 0, missingSome: 0, withCollision: 0 },
    events: { total: 0, withCollision: 0, collisionClips: 0, withGap: 0, withOverlap: 0, maxOverlapSec: 0, maxGapSec: 0 },
    reasons: new Map(),
    sidecar: { total: 0, parsed: 0, failed: 0, withCity: 0, withStreet: 0, latIsString: 0, unknownReason: {} },
    thumbs: new Map(),
    durations: { n: 0, min: 999, max: 0, buckets: {}, under30: 0, over65: 0, firstLt30: 0, lastLt30: 0 },
    sampleTracks: {},
};

function recordDuration(sec) {
    if (!Number.isFinite(sec) || sec <= 0) return null;
    const d = stats.durations;
    d.n += 1;
    d.min = Math.min(d.min, sec);
    d.max = Math.max(d.max, sec);
    const bucket = sec < 25 ? '<25' : sec < 55 ? '25-55' : sec <= 65 ? '55-65' : sec <= 90 ? '65-90' : '>90';
    d.buckets[bucket] = (d.buckets[bucket] || 0) + 1;
    if (sec < 30) d.under30 += 1;
    if (sec > 65) d.over65 += 1;
    return sec;
}

function analyseGroup(files) {
    const minutes = new Map();
    for (const name of files) {
        const p = parseName(name);
        if (!p) continue;
        if (!minutes.has(p.minute)) minutes.set(p.minute, { stamps: new Map(), cams: new Set() });
        const m = minutes.get(p.minute);
        if (!m.stamps.has(p.stamp)) m.stamps.set(p.stamp, new Set());
        m.stamps.get(p.stamp).add(p.camera);
        m.cams.add(p.camera);
    }
    let collision = 0, collisionClips = 0;
    for (const m of minutes.values()) {
        if (m.stamps.size > 1) {
            collision += 1;
            collisionClips += [...m.stamps.values()].reduce((s, cams) => s + cams.size, 0);
        }
    }
    return { minutes, collision, collisionClips };
}

async function walkEvent(dir) {
    const entries = await listDir(dir);
    const files = entries.filter(e => e.isFile()).map(e => e.name);
    const mp4 = files.filter(n => n.endsWith('.mp4'));
    if (!mp4.length) return null;
    const g = analyseGroup(mp4);
    stats.minutes.total += g.minutes.size;
    for (const m of g.minutes.values()) {
        if (m.cams.size >= 6) stats.minutes.complete6 += 1;
        else stats.minutes.missingSome += 1;
    }
    if (g.collision) { stats.minutes.withCollision += 1; stats.events.withCollision += 1; stats.events.collisionClips += g.collisionClips; }
    for (const n of mp4) {
        const p = parseName(n);
        if (p) bump(stats.cameras, p.camera);
    }
    return { dir, files, mp4, minutes: g.minutes, filesByName: new Map(files.map((n, i) => [n, i])) };
}

async function readSidecar(dir, files) {
    const s = stats.sidecar;
    if (!files.includes('event.json')) return;
    s.total += 1;
    try {
        const raw = await fs.readFile(path.join(dir, 'event.json'), 'utf8');
        const j = JSON.parse(raw);
        s.parsed += 1;
        if (j.city) s.withCity += 1;
        if (j.street) s.withStreet += 1;
        if (typeof j.est_lat === 'string') s.latIsString += 1;
        const r = typeof j.reason === 'string' && j.reason.trim() ? j.reason.trim() : '(none)';
        bump(stats.reasons, r);
    } catch { s.failed += 1; }
    if (files.includes('thumb.png')) {
        const dim = await pngSize(path.join(dir, 'thumb.png'));
        const key = dim ? `${dim.w}x${dim.h}` : 'bad';
        bump(stats.thumbs, key);
    }
}

async function sampleDurations(event, take) {
    // Front view first, one per minute, in name order.
    const byMinute = new Map();
    for (const name of event.mp4) {
        const p = parseName(name);
        if (!p) continue;
        const cur = byMinute.get(p.minute);
        if (!cur || (p.camera === 'front' && cur.camera !== 'front')) byMinute.set(p.minute, { name, camera: p.camera });
    }
    const sorted = [...byMinute.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const picked = sorted.slice(0, take);
    const out = [];
    for (const [minute, { name }] of picked) {
        const info = await mp4Info(path.join(event.dir, name));
        const sec = info ? recordDuration(info.seconds) : null;
        out.push({ minute, sec, front: name.includes('-front.') });
    }
    if (out.length && out[0].sec && out[0].sec < 30) stats.durations.firstLt30 += 1;
    if (out.length > 1 && out[out.length - 1].sec && out[out.length - 1].sec < 30) stats.durations.lastLt30 += 1;
    return out;
}

// ---- main ------------------------------------------------------------------
const started = Date.now();
const recent = await walkEvent(path.join(ROOT, 'RecentClips'));
stats.categories.RecentClips = { events: 1, mp4: recent.mp4.length, minutes: recent.minutes.size };
await sampleDurations(recent, 400);

for (const category of ['SavedClips', 'SentryClips']) {
    const dirs = (await listDir(path.join(ROOT, category))).filter(e => e.isDirectory());
    const bucket = { events: 0, mp4: 0, minutes: 0, collisionEvents: 0 };
    const events = [];
    for (const e of dirs) {
        const full = path.join(ROOT, category, e.name);
        const ev = await walkEvent(full);
        if (!ev) continue;
        bucket.events += 1;
        bucket.mp4 += ev.mp4.length;
        bucket.minutes += ev.minutes.size;
        if ([...ev.minutes.values()].some(m => m.stamps.size > 1)) bucket.collisionEvents += 1;
        events.push(ev);
    }
    stats.categories[category] = bucket;
    stats.events.total += bucket.events;
    for (const ev of events) {
        const files = ev.files;
        await readSidecar(ev.dir, files);
    }
    // Sample: first event of each month-ish spread + a deterministic stride.
    const stride = Math.max(1, Math.floor(events.length / (category === 'SavedClips' ? 120 : 160)));
    const sampled = events.filter((_, i) => i % stride === 0).slice(0, category === 'SavedClips' ? 120 : 160);
    for (const ev of sampled) {
        const secs = await sampleDurations(ev, 4);
        // Gap/overlap between consecutive minutes that both have a duration.
        const usable = secs.filter(s => s.sec && s.minute);
        for (let i = 1; i < usable.length; i += 1) {
            const [y, mo, d] = usable[i - 1].minute.slice(0, 10).split('-').map(Number);
            const [hh, mi] = usable[i - 1].minute.slice(11, 16).split(':').map(Number);
            const start = Date.UTC(y, mo - 1, d, hh, mi);
            const next = usable[i].minute;
            const [y2, mo2, d2] = next.slice(0, 10).split('-').map(Number);
            const [hh2, mi2] = next.slice(11, 16).split(':').map(Number);
            const delta = (Date.UTC(y2, mo2 - 1, d2, hh2, mi2) - start) / 1000;
            const slack = delta - usable[i - 1].sec;
            if (slack < -2) {
                stats.events.withOverlap += 1;
                stats.events.maxOverlapSec = Math.max(stats.events.maxOverlapSec, -slack);
            } else if (slack > 2) {
                stats.events.withGap += 1;
                stats.events.maxGapSec = Math.max(stats.events.maxGapSec, slack);
            }
        }
    }
}

// One minute of one event: codec / size / rotation per camera.
const probeEvent = await listDir(path.join(ROOT, 'SentryClips'));
for (const e of probeEvent.filter(x => x.isDirectory()).slice(0, 1)) {
    const dir = path.join(ROOT, 'SentryClips', e.name);
    const files = (await listDir(dir)).filter(x => x.isFile() && x.name.endsWith('.mp4')).map(x => x.name).sort();
    const seen = new Set();
    for (const f of files) {
        const cam = parseName(f)?.camera;
        if (!cam || seen.has(cam)) continue;
        seen.add(cam);
        const info = await trackInfo(path.join(dir, f));
        stats.sampleTracks[cam] = info;
    }
}

stats.elapsedSec = Math.round((Date.now() - started) / 1000);
for (const key of ['cameras', 'reasons', 'thumbs']) stats[key] = Object.fromEntries(stats[key]);
console.log(JSON.stringify(stats, null, 1));

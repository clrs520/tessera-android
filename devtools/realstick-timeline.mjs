// R157 — timeline shape over the whole stick: gaps, overlaps, boundary clips.
// Names carry every clip's start second, so the wall-clock shape of all 3,167 events is free.
// Durations are read for the first and last clip of a sample of events, and for the clip before
// every short (< 55 s) hand-off in that sample, which is where an overlap can actually exist.
import { promises as fs } from 'node:fs';

const ROOT = process.argv[2] || 'D:/TeslaCam';
const asBuffer = Buffer.alloc(64 * 1024);

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
    } else if (size === 0) size = total - pos;
    if (size < header || pos + size > total) return null;
    return { size, kind, header, end: pos + size };
}

async function duration(file) {
    let fh;
    try {
        fh = await fs.open(file, 'r');
        const { size: total } = await fh.stat();
        let pos = 0;
        for (let i = 0; i < 512 && pos + 8 <= total; i += 1) {
            const b = boxAt(await readAt(fh, pos, 16), 0, total);
            if (!b) return null;
            if (b.kind === 'moov') {
                const data = await readAt(fh, pos + b.header, Math.min(b.size - b.header, asBuffer.length));
                for (let p = 0; p + 8 <= data.length;) {
                    const c = boxAt(data, p, data.length);
                    if (!c) return null;
                    if (c.kind === 'mvhd') {
                        const v = data[p + c.header];
                        const ts = v === 1 ? data.readUInt32BE(p + c.header + 20) : data.readUInt32BE(p + c.header + 12);
                        const dur = v === 1 ? Number(data.readBigUInt64BE(p + c.header + 24)) : data.readUInt32BE(p + c.header + 16);
                        if (!ts || !dur || dur === 0xffffffff) return null;
                        return dur / ts;
                    }
                    p = c.end;
                }
                return null;
            }
            pos += b.size;
        }
        return null;
    } catch { return null; } finally { await fh?.close().catch(() => {}); }
}

const NAME = /^(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})-(front|back|left_repeater|right_repeater|left_pillar|right_pillar)\.mp4$/;
function stampOf(name) {
    const m = NAME.exec(name);
    return m ? { stamp: m[1], cam: m[2] } : null;
}
function epoch(stamp) {
    const [d, t] = stamp.split('_');
    const [Y, M, D] = d.split('-').map(Number);
    const [h, m, s] = t.split('-').map(Number);
    return Date.UTC(Y, M - 1, D, h, m, s);
}

async function listDir(dir) {
    try { return await fs.readdir(dir, { withFileTypes: true }); } catch { return []; }
}

async function eventTimeline(dir) {
    const entries = await listDir(dir);
    const stamps = new Map(); // stamp -> {front?, any}
    for (const e of entries) {
        if (!e.isFile()) continue;
        const p = stampOf(e.name);
        if (!p) continue;
        const cur = stamps.get(p.stamp) || { front: null, any: null };
        if (p.cam === 'front') cur.front = e.name; else if (!cur.any) cur.any = e.name;
        stamps.set(p.stamp, cur);
    }
    const keys = [...stamps.keys()].sort();
    return { dir, stamps, keys, first: keys[0], last: keys[keys.length - 1] };
}

const out = {
    categories: {},
    deltas: { under55: 0, '55-65': 0, '65-90': 0, over90: 0 },
    boundary: { sampled: 0, firstShort: 0, lastShort: 0, firstMin: 99, lastMin: 99, firstBuckets: {}, lastBuckets: {} },
    overlaps: { handoffsUnder55: 0, sampled: 0, realOverlap: 0, maxOverlapSec: 0, mediaOverlapSec: [] },
    gaps: { eventsWithGap: 0, maxGapSec: 0, eventsWithHugeGap: 0 },
};

const recent = await eventTimeline(ROOT + '/RecentClips');
out.categories.RecentClips = { clips: recent.keys.length, first: recent.first, last: recent.last };
const allEvents = [];
for (const category of ['SavedClips', 'SentryClips']) {
    const dirs = (await listDir(`${ROOT}/${category}`)).filter(e => e.isDirectory());
    let clips = 0, gapEvents = 0, huge = 0, maxGap = 0, minStamp = null, maxStamp = null;
    for (const e of dirs) {
        const ev = await eventTimeline(`${ROOT}/${category}/${e.name}`);
        if (!ev.keys.length) continue;
        clips += ev.keys.length;
        minStamp = !minStamp || ev.first < minStamp ? ev.first : minStamp;
        maxStamp = !maxStamp || ev.last > maxStamp ? ev.last : maxStamp;
        let hasGap = false;
        for (let i = 1; i < ev.keys.length; i += 1) {
            const delta = (epoch(ev.keys[i]) - epoch(ev.keys[i - 1])) / 1000;
            if (delta < 55) out.deltas.under55 += 1;
            else if (delta <= 65) out.deltas['55-65'] += 1;
            else if (delta <= 90) out.deltas['65-90'] += 1;
            else {
                out.deltas.over90 += 1;
                if (!hasGap) { hasGap = true; gapEvents += 1; }
                if (delta > 300) huge += 1;
                maxGap = Math.max(maxGap, delta);
            }
        }
        allEvents.push({ category, ev });
    }
    out.categories[category] = { events: allEvents.filter(e => e.category === category).length, clips, gapEvents, hugeGaps: huge, maxGapSec: Math.round(maxGap), first: minStamp, last: maxStamp };
}
out.gaps.eventsWithGap = Object.values(out.categories).reduce((s, c) => s + (c.gapEvents || 0), 0);
out.gaps.maxGapSec = Math.max(...Object.values(out.categories).map(c => c.maxGapSec || 0));
out.gaps.eventsWithHugeGap = Object.values(out.categories).reduce((s, c) => s + (c.hugeGaps || 0), 0);

// Sample: every Nth event, first and last clip durations, plus the hand-off pairs under 55 s.
const stride = Math.max(1, Math.floor(allEvents.length / 300));
const sampled = allEvents.filter((_, i) => i % stride === 0);
for (const { ev } of sampled) {
    const first = ev.stamps.get(ev.first);
    const last = ev.stamps.get(ev.last);
    const fd = await duration(`${ev.dir}/${first.front || first.any}`);
    const ld = await duration(`${ev.dir}/${last.front || last.any}`);
    if (fd) {
        out.boundary.sampled += 1;
        out.boundary.firstMin = Math.min(out.boundary.firstMin, fd);
        const bucket = fd < 10 ? '<10' : fd < 30 ? '10-30' : fd < 55 ? '30-55' : '>=55';
        out.boundary.firstBuckets[bucket] = (out.boundary.firstBuckets[bucket] || 0) + 1;
        if (fd < 30) out.boundary.firstShort += 1;
    }
    if (ld) {
        out.boundary.lastMin = Math.min(out.boundary.lastMin, ld);
        const bucket = ld < 10 ? '<10' : ld < 30 ? '10-30' : ld < 55 ? '30-55' : '>=55';
        out.boundary.lastBuckets[bucket] = (out.boundary.lastBuckets[bucket] || 0) + 1;
        if (ld < 30) out.boundary.lastShort += 1;
    }
    for (let i = 1; i < ev.keys.length; i += 1) {
        const delta = (epoch(ev.keys[i]) - epoch(ev.keys[i - 1])) / 1000;
        if (delta >= 55) continue;
        out.overlaps.handoffsUnder55 += 1;
        if (out.overlaps.sampled >= 120) continue;
        const prev = ev.stamps.get(ev.keys[i - 1]);
        const pd = await duration(`${ev.dir}/${prev.front || prev.any}`);
        if (!pd) continue;
        out.overlaps.sampled += 1;
        const slack = delta - pd;
        if (slack < -2) {
            out.overlaps.realOverlap += 1;
            out.overlaps.maxOverlapSec = Math.max(out.overlaps.maxOverlapSec, Math.round(-slack));
            out.overlaps.mediaOverlapSec.push(Math.round(-slack));
        }
    }
}
out.overlaps.mediaOverlapSec.sort((a, b) => a - b);
out.overlaps.medianOverlapSec = out.overlaps.mediaOverlapSec.length
    ? out.overlaps.mediaOverlapSec[Math.floor(out.overlaps.mediaOverlapSec.length / 2)] : 0;
delete out.overlaps.mediaOverlapSec;
console.log(JSON.stringify(out, null, 1));

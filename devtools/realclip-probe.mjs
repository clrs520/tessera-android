// Probe real TeslaCam MP4s without ffprobe: top-level MP4 box walk + moov fields.
// Reads only box headers and the moov payload, so an 80 MB clip costs a few MB of I/O.
import { openSync, readSync, closeSync, statSync } from 'node:fs';

function readAt(fd, pos, len) {
  const b = Buffer.alloc(len);
  const n = readSync(fd, b, 0, len, pos);
  return b.subarray(0, n);
}
function boxes(buf, start = 0, end = buf.length) {
  const out = [];
  let p = start;
  while (p + 8 <= end) {
    let size = buf.readUInt32BE(p);
    const type = buf.toString('latin1', p + 4, p + 8);
    let head = 8;
    if (size === 1) { size = Number(buf.readBigUInt64BE(p + 8)); head = 16; }
    else if (size === 0) size = end - p;
    if (size < head) break;
    out.push({ type, start: p, size, body: p + head });
    p += size;
  }
  return out;
}
function find(buf, start, end, type) {
  return boxes(buf, start, end).find(b => b.type === type);
}
function u32(b, o) { return b.readUInt32BE(o); }

function probe(path) {
  const fd = openSync(path, 'r');
  try {
    const total = statSync(path).size;
    // walk top-level boxes by seeking, then read moov
    let pos = 0, moov = null, top = [];
    while (pos + 8 <= total) {
      const h = readAt(fd, pos, 16);
      let size = h.readUInt32BE(0);
      const type = h.toString('latin1', 4, 8);
      let head = 8;
      if (size === 1) { size = Number(h.readBigUInt64BE(8)); head = 16; }
      else if (size === 0) size = total - pos;
      top.push(`${type}(${size})`);
      if (type === 'moov') moov = readAt(fd, pos + head, size - head);
      if (size < head) break;
      pos += size;
    }
    if (!moov) return { path, top };
    const mo = boxes(moov, 0, moov.length);
    const mvhd = mo.find(b => b.type === 'mvhd');
    let durationSec = null, timescale = null;
    if (mvhd) {
      const v = moov[mvhd.body];
      if (v === 1) { timescale = u32(moov, mvhd.body + 20); durationSec = Number(moov.readBigUInt64BE(mvhd.body + 24)) / timescale; }
      else { timescale = u32(moov, mvhd.body + 12); durationSec = u32(moov, mvhd.body + 16) / timescale; }
    }
    const tracks = mo.filter(b => b.type === 'trak').map(tr => {
      const tk = find(moov, tr.body, tr.body + tr.size, 'tkhd');
      let rotation = 0;
      if (tk) {
        const v = moov[tk.body];
        const m = tk.body + (v === 1 ? 4 + 8 + 8 + 8 + 2 + 2 + 2 + 2 + 8 : 4 + 4 + 4 + 4 + 4 + 4 + 4 + 4 + 8);
        const a = u32(moov, m) / 65536, b = u32(moov, m + 4) / 65536;
        const c = u32(moov, m + 12) / 65536, d = u32(moov, m + 16) / 65536;
        rotation = Math.round(Math.atan2(b, a) * 180 / Math.PI);
        if (Math.abs(c) === 1 && Math.abs(d) === 0) rotation = Math.round(Math.atan2(c, -b) * 180 / Math.PI);
      }
      const mdia = find(moov, tr.body, tr.body + tr.size, 'mdia');
      let trackDur = null, ts = null, fourcc = null, w = null, h = null;
      if (mdia) {
        const mdhd = find(moov, mdia.body, mdia.body + mdia.size, 'mdhd');
        if (mdhd) {
          const v = moov[mdhd.body];
          ts = u32(moov, mdhd.body + (v === 1 ? 20 : 12));
          trackDur = (v === 1 ? Number(moov.readBigUInt64BE(mdhd.body + 24)) : u32(moov, mdhd.body + 16)) / ts;
        }
        const minf = find(moov, mdia.body, mdia.body + mdia.size, 'minf');
        const stbl = minf && find(moov, minf.body, minf.body + minf.size, 'stbl');
        const stsd = stbl && find(moov, stbl.body, stbl.body + stbl.size, 'stsd');
        if (stsd) {
          // stsd: version/flags(4) entry_count(4) then sample entry
          const e = stsd.body + 8;
          fourcc = moov.toString('latin1', e + 4, e + 8);
          w = moov.readUInt16BE(e + 8 + 24);
          h = moov.readUInt16BE(e + 8 + 26);
        }
      }
      return { rotation, trackDur: trackDur && +trackDur.toFixed(3), timescale: ts, fourcc, w, h };
    });
    return { path: path.split(/[\\/]/).pop(), total, durationSec: durationSec && +durationSec.toFixed(3), tracks, top: top.join(' ') };
  } finally { closeSync(fd); }
}

for (const p of process.argv.slice(2)) console.log(JSON.stringify(probe(p)));

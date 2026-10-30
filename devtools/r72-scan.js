// Offline scan: does a given mp4 contain H.264 SEI NALs (type 6)?
const fs = require('fs'), path = require('path');
function scan(p) {
  const buf = fs.readFileSync(p), view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let mdat = null, cursor = 0;
  while (cursor + 8 <= buf.byteLength) {
    let size = view.getUint32(cursor); const type = buf.toString('ascii', cursor + 4, cursor + 8);
    let hdr = 8;
    if (size === 1) { size = Number((BigInt(view.getUint32(cursor + 8)) << 32n) | BigInt(view.getUint32(cursor + 12))); hdr = 16; }
    else if (size === 0) size = buf.byteLength - cursor;
    if (type === 'mdat') { mdat = { start: cursor + hdr, end: cursor + size }; break; }
    cursor += size;
  }
  if (!mdat) return { p, err: 'no mdat' };
  const types = {}; let c = mdat.start, sei = [];
  while (c + 4 <= mdat.end) {
    const len = view.getUint32(c); c += 4;
    if (len < 1 || c + len > buf.byteLength) break;
    const t = buf[c] & 0x1f; types[t] = (types[t] || 0) + 1;
    if (t === 6 && sei.length < 2) sei.push(buf.toString('hex', c, c + Math.min(len, 20)));
    c += len;
  }
  return { p: path.basename(p), mb: +(buf.byteLength / 1048576).toFixed(1), types, sei };
}
const dir = 'C:/Users/Xingcong/Desktop/SavedClips/2026-10-08_07-41-59';
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mp4')).slice(0, 3)) console.log(JSON.stringify(scan(path.join(dir, f))));

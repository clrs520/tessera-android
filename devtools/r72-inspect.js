const fs = require('fs');
const p = 'C:/Users/Xingcong/Desktop/SavedClips/2026-10-08_07-41-59/2026-10-08_07-30-59-front.mp4';
const buf = fs.readFileSync(p), view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const CONT = ['moov','trak','mdia','minf','stbl','udta','edts','dinf','mvex'];
function walk(start, end, depth, out) {
  for (let pos = start; pos + 8 <= end;) {
    let size = view.getUint32(pos); const type = buf.toString('ascii', pos + 4, pos + 8);
    let hdr = 8;
    if (size === 1) { size = Number((BigInt(view.getUint32(pos+8))<<32n)|BigInt(view.getUint32(pos+12))); hdr = 16; }
    else if (size === 0) size = end - pos;
    const box = { type, pos, size, hdr, payload: pos + hdr, children: [] };
    if (CONT.includes(type) || type === 'stsd') walk(pos + hdr, pos + size, depth + 1, box.children);
    out.push(box); pos += size;
  }
  return out;
}
const tree = walk(0, buf.byteLength, 0, []);
const find = (t, from = tree) => { for (const b of from) { if (b.type === t) return b; const h = find(t, b.children); if (h) return h; } };
console.log('top:', tree.map(b => `${b.type}@${b.pos}+${b.size}`).join(' '));
for (const t of ['mvhd','tkhd','mdhd','hdlr','stts','stsc','stsz','stco','co64','stss','stsd','avcC']) {
  const b = find(t); if (!b) { console.log(t, 'ABSENT'); continue; }
  console.log(`${t}: pos=${b.pos} size=${b.size} ver=${buf[b.payload]}`);
}
const u32 = o => view.getUint32(o);
for (const [n, base] of [['stts','stts'],['stsz','stts']]) {}
const stts = find('stts'); const ec = u32(stts.payload + 4);
console.log('stts entries', ec, [...Array(Math.min(ec,5))].map((_,i)=>`count=${u32(stts.payload+8+i*8)} delta=${u32(stts.payload+12+i*8)}`));
const mdhd = find('mdhd'); console.log('mdhd timescale', u32(mdhd.payload + 12), 'duration', u32(mdhd.payload + 16));
const stsz = find('stsz'); console.log('stsz sampleSize(default)', u32(stsz.payload+4), 'count', u32(stsz.payload+8), 'first', [...Array(6)].map((_,i)=>u32(stsz.payload+12+i*4)));
const stsc = find('stsc'); console.log('stsc entries', u32(stsc.payload+4), [...Array(Math.min(u32(stsc.payload+4),4))].map((_,i)=>`first=${u32(stsc.payload+8+i*12)} n=${u32(stsc.payload+12+i*12)} id=${u32(stsc.payload+16+i*12)}`));
const stco = find('stco'); console.log('stco entries', u32(stco.payload+4), [...Array(Math.min(u32(stco.payload+4),4))].map((_,i)=>u32(stco.payload+8+i*4)));
const stss = find('stss'); if (stss) console.log('stss entries', u32(stss.payload+4), [...Array(Math.min(u32(stss.payload+4),6))].map((_,i)=>u32(stss.payload+8+i*4)));
const avc1 = find('avc1'); console.log('avc1', avc1 && `${u32(avc1.payload+4)}x${u32(avc1.payload+6)?0:buf.readUInt16BE(avc1.payload+24)}x${buf.readUInt16BE(avc1.payload+26)}`);
const avcC = find('avcC'); console.log('avcC', avcC && avcC.size, avcC && buf.toString('hex', avcC.payload, avcC.payload+8));

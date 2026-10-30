const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const asc = (o, n) => Buffer.from(buf.subarray(o, o + n)).toString('latin1');
const CONTAINERS = new Set(['moov','trak','mdia','minf','stbl','dinf','edts','udta','mvex']);
const out = [];
function walk(start, end, depth) {
  let pos = start;
  while (pos + 8 <= end) {
    let size = view.getUint32(pos);
    const type = asc(pos + 4, 4);
    let header = 8;
    if (size === 1) { size = Number(view.getBigUint64(pos + 8)); header = 16; }
    else if (size === 0) { size = end - pos; }
    if (size < header || pos + size > end) break;
    out.push({ d: depth, type, size, at: pos });
    if (CONTAINERS.has(type)) walk(pos + header, pos + size, depth + 1);
    if (/^(stsd)$/.test(type)) {
      // sample entry: 8cc version.. then format at +12
      out.push({ d: depth + 1, type: 'entry:' + asc(pos + 8 + 12, 4), size: 0, at: pos + 20 });
    }
    pos += size;
  }
}
walk(0, buf.length, 0);
console.log(JSON.stringify(out.filter(e => !/^(free|skip|wide|uuid)$/.test(e.type)).slice(0, 60)));

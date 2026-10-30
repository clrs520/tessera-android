const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
// mdat payload: box at 40 (size, 'mdat') -> payload starts at 48
let cursor = 48;
const end = buf.length - 19000; // stop before moov
const hist = {};
const seis = [];
let n = 0;
while (cursor + 4 <= end && n < 200000) {
  const len = view.getUint32(cursor);
  cursor += 4;
  if (len < 1 || len > 2_000_000 || cursor + len > end) { hist['__break_at'] = cursor; break; }
  const t = view.getUint8(cursor) & 0x1F;
  hist[t] = (hist[t] || 0) + 1;
  if (t === 6 && seis.length < 3) {
    const d = Buffer.from(buf.subarray(cursor, cursor + len));
    seis.push({ len, hex: d.subarray(0, 48).toString('hex'), pt: d[1], size: d[2] });
  }
  cursor += len;
  n++;
}
console.log(JSON.stringify({ nalCount: n, hist, seis }, null, 1));

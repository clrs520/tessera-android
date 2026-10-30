const fs = require('fs');
function dump(p, label) {
  const buf = fs.readFileSync(p);
  const CONT = ['moov','trak','mdia','minf','stbl','edts','dinf','mvex','udta','mfra','stsd'];
  function walk(s, e, d) {
    const o = [];
    for (let q = s; q + 8 <= e;) {
      let sz = buf.readUInt32BE(q); const t = buf.toString('latin1', q + 4, q + 8).replace(/[^\x20-\x7e]/g, '?');
      let h = 8;
      if (sz === 1) { sz = Number((BigInt(buf.readUInt32BE(q + 8)) << 32n) | BigInt(buf.readUInt32BE(q + 12))); h = 16; }
      else if (sz === 0) sz = e - q;
      const bad = sz < h || q + sz > e;
      o.push(`${'  '.repeat(d)}${t} ${sz}${bad ? '  <== BAD' : ''}`);
      if (CONT.includes(t) && !bad) o.push(...walk(q + h, q + sz, d + 1));
      q += sz;
    }
    return o;
  }
  console.log(`=== ${label} (${buf.length} bytes)`);
  console.log(walk(0, buf.length, 0).join('\n'));
}
dump(process.argv[2], process.argv[3] || 'file');

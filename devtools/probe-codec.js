const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]);
const fourcc = (o) => buf.toString('latin1', o, o + 4);
const found = [];
for (let i = 0; i + 8 <= buf.length; i += 4) {
  const s = buf.readUInt32BE(i);
  const t = fourcc(i + 4);
  if (/^(mdat|moov|avc1|hvc1|hev1|avcC|hvcC|stsd|vmhd|vide)$/.test(t) && s > 7 && i + s < buf.length + 1) {
    // heuristic: only report fourccs we care about
  }
  if (/^(avc1|hvc1|hev1|avcC|hvcC)$/.test(t)) found.push({ t, at: i });
}
console.log(JSON.stringify({ file: require('path').basename(process.argv[2]), fourccs: found.slice(0, 8), size: buf.length }));

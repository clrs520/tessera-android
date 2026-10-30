// Hand-decode a few payloads straight out of the shipped JS parser to prove the fixture's protobuf
// (and its emulation-prevention round trip) is well formed.
const fs = require('fs');
global.window = {};
eval(fs.readFileSync('TDashcamStudio/src/dashcam-mp4.js', 'utf8'));
const f = process.argv[2] || 'devtools/seifix/2026-10-09_09-00-00/2026-10-09_09-00-00-front.mp4';
const buf = fs.readFileSync(f);
const mp4 = new window.DashcamMP4(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const meta = mp4.parseMetadata();
const NAMES = { 1: 'version', 2: 'gear', 3: 'seq', 4: 'speed_mps', 5: 'pedal', 6: 'steer', 7: 'blinkL', 9: 'brake', 10: 'ap', 11: 'lat', 12: 'lon', 13: 'head', 14: 'ax', 15: 'ay', 16: 'az' };
function read(u8) {
  const b = Buffer.from(u8); let i = 0; const out = {};
  while (i < b.length) {
    const t = b[i++], field = t >> 3, wire = t & 7;
    if (wire === 0) { let v = 0n, s = 0; while (i < b.length) { const c = b[i++]; v |= BigInt(c & 0x7f) << BigInt(s); s += 7; if (!(c & 0x80)) break; } out[field] = Number(v); }
    else if (wire === 5) { out[field] = +b.readFloatLE(i).toFixed(4); i += 4; }
    else if (wire === 1) { out[field] = +b.readDoubleLE(i).toFixed(6); i += 8; }
    else throw new Error('unknown wire ' + wire + ' at ' + i);
  }
  const named = {};
  for (const k of Object.keys(out)) named[NAMES[k] || k] = out[k];
  return named;
}
for (const k of [0, 1, 74, 149]) console.log('frame', k, 't=' + meta[k].time, JSON.stringify(read(meta[k].data)));

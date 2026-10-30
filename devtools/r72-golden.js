// Golden output for the Rust SEI walk: runs the shipped JS parser (src/dashcam-mp4.js, untouched)
// over every fixture and every desktop clip available, and writes {time, payload} per file.
// `cargo test` in devtools/seiharness then asserts the native walk produces byte-identical results,
// so the Rust port is measured against the parser it replaces rather than against a description.
const fs = require('fs'), path = require('path');
global.window = {};
eval(fs.readFileSync('TDashcamStudio/src/dashcam-mp4.js', 'utf8'));
const DashcamMP4 = global.window.DashcamMP4;

const targets = [];

// JSON has no lossless float representation, and a decimal time like 0.12420000000000002 only has
// to be re-read by a correctly-rounded parser to come back different. Writing the raw IEEE-754 bits
// means the native walk is asserted against the exact double the JS parser produced.
function f64bits(v) {
  const b = Buffer.alloc(8);
  b.writeDoubleLE(v, 0);
  return b.toString('hex');
}

const fixDir = 'devtools/seifix/2026-10-09_09-00-00';
for (const f of fs.readdirSync(fixDir).filter(x => x.endsWith('.mp4'))) {
  targets.push({ label: `sei/${f}`, file: path.resolve(fixDir, f) });
}
// Real Tesla clips. These particular ones carry no SEI telemetry, which is exactly the case a
// native port gets wrong by returning a partial or off-by-one empty result — and they are the
// large files, so they also put a real number on the reading cost.
const realRoots = [
  'C:/Users/Xingcong/Desktop/SavedClips/2026-10-08_07-41-59',
  'C:/Users/Xingcong/Desktop/SavedClips/2026-10-08_07-30-59'
];
for (const root of realRoots) {
  if (!fs.existsSync(root)) continue;
  for (const f of fs.readdirSync(root).filter(x => x.endsWith('.mp4')).slice(0, 4)) {
    targets.push({ label: `real/${f}`, file: path.join(root, f) });
  }
}

const out = {};
for (const t of targets) {
  const buf = fs.readFileSync(t.file);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  let meta, err = null;
  try {
    meta = new DashcamMP4(ab).parseMetadata();
  } catch (e) {
    meta = null;
    err = String(e.message || e);
  }
  out[t.label] = err
    ? { file: t.file, error: err }
    : {
        file: t.file,
        bytes: buf.length,
        count: meta.length,
        samples: meta.map(m => ({
          time: m.time,
          timeBits: f64bits(m.time),
          payload: Array.from(new Uint8Array(m.data.buffer.slice(m.data.byteOffset, m.data.byteOffset + m.data.byteLength)))
        }))
      };
}
fs.writeFileSync('devtools/seiharness/golden.json', JSON.stringify(out));
console.log(Object.entries(out).map(([k, v]) => `${k}: ${v.error ? 'ERROR ' + v.error : v.count + ' samples, ' + (v.samples[0]?.payload.length ?? 0) + 'B'}`).join('\n'));

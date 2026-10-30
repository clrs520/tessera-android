// Ground truth for the fixture: run the shipped upstream parser (src/dashcam-mp4.js, untouched) in
// Node and confirm the rebuilt file yields one SEI sample per frame with the expected times.
// Protobuf decoding happens in the app, where protobufjs is already loaded.
const fs = require('fs'), path = require('path');
global.window = {};
eval(fs.readFileSync('TDashcamStudio/src/dashcam-mp4.js', 'utf8'));
const DashcamMP4 = global.window.DashcamMP4;

const dir = 'devtools/seifix/2026-10-09_09-00-00';
const golden = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mp4'))) {
  const buf = fs.readFileSync(path.join(dir, f));
  const mp4 = new DashcamMP4(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const cfg = mp4.getConfig();
  const meta = mp4.parseMetadata();
  const expect = JSON.parse(fs.readFileSync(path.join(dir, f + '.times.json'), 'utf8'));
  const worstDt = Math.max(...meta.map((m, i) => Math.abs(m.time - expect[i])));
  console.log(JSON.stringify({
    file: f, mb: +(buf.length / 1048576).toFixed(2),
    durSamples: cfg.durations.length, rawSei: meta.length,
    t0: meta[0]?.time, t1: meta[1]?.time, tLast: meta[meta.length - 1]?.time,
    matchesGeneratorTimes: worstDt < 1e-6, worstDt,
    payloadBytes: meta[0]?.data?.length, firstHex: Buffer.from(meta[0]?.data || []).toString('hex').slice(0, 24)
  }));
}

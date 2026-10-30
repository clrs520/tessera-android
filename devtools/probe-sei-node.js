const fs = require('fs'), path = require('path'), vm = require('vm');
const root = 'TDashcamStudio/src';
const src = fs.readFileSync(path.join(root, 'dashcam-mp4.js'), 'utf8');
const sandbox = { window: {}, console, DataView, Uint8Array, BigInt, TextDecoder, Map, Set, JSON, Math, Number, Array, String, Error };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const DashcamMP4 = sandbox.window.DashcamMP4;
const file = process.argv[2];
const buf = fs.readFileSync(file);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const p = new DashcamMP4(ab);
let items = null, err = null;
try { items = p.parseMetadata(); } catch (e) { err = String(e && e.stack || e); }
console.log(JSON.stringify({
  file: path.basename(file), bytes: buf.length,
  config: (() => { try { return p.getConfig ? !!p.getConfig() : undefined; } catch (e) { return 'throw ' + e; } })(),
  err, count: items ? items.length : null,
  first: items && items[0] ? { time: items[0].time, len: items[0].data.byteLength || items[0].data.length } : null,
  last: items && items.length ? { time: items[items.length-1].time } : null,
}, null, 1));

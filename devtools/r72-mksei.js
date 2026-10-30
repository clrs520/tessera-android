// R72: build an SEI-bearing, still-playable clip from a real one.
// The AVD fixtures carry no H.264 SEI at all (mdat holds only NAL types 1/5/7/8), so the
// old-JS-vs-new-Rust telemetry comparison would have been a vacuous pass. This keeps the real
// video NALs and rebuilds the sample table around them, prepending one Tesla-shaped SEI to each
// frame. Node only, no dependency on the app.
const fs = require('fs');
const path = require('path');

const SRC_DIR = process.argv[2] || 'C:/Users/Xingcong/Desktop/SavedClips/2026-10-08_07-41-59';
const OUT_DIR = process.argv[3] || path.join(__dirname, 'seifix', '2026-10-09_09-00-00');
const SRC_STEM = process.argv[4] || '2026-10-08_07-30-59';
const OUT_STEM = process.argv[5] || '2026-10-09_09-00-00';
const FRAMES = Number(process.argv[6] || 150);

const CONTAINERS = ['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'mvex', 'udta', 'mfra'];

// ---------- box tree ----------
function parse(buf) {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  function walk(start, end) {
    const out = [];
    for (let pos = start; pos + 8 <= end;) {
      let size = view.getUint32(pos);
      const type = buf.toString('ascii', pos + 4, pos + 8);
      let hdr = 8;
      if (size === 1) { size = Number((BigInt(view.getUint32(pos + 8)) << 32n) | BigInt(view.getUint32(pos + 12))); hdr = 16; }
      else if (size === 0) size = end - pos;
      if (size < hdr) break;
      const node = { type, hdr, children: null, raw: null, abs: pos };
      if (CONTAINERS.includes(type)) node.children = walk(pos + hdr, pos + size);
      else node.raw = buf.subarray(pos + hdr, pos + size);
      out.push(node);
      pos += size;
    }
    return out;
  }
  return walk(0, buf.byteLength);
}

function find(nodes, type) {
  for (const n of nodes) {
    if (n.type === type) return n;
    if (n.children) { const hit = find(n.children, type); if (hit) return hit; }
  }
  return null;
}

function bodySize(nodes) {
  let sum = 0;
  for (const n of nodes) sum += n.hdr + (n.children ? bodySize(n.children) : n.raw.length);
  return sum;
}

function serialize(nodes, parts) {
  for (const n of nodes) {
    const body = n.children ? bodySize(n.children) : n.raw.length;
    const head = Buffer.alloc(n.hdr);
    head.writeUInt32BE(n.hdr + body, 0);
    head.write(n.type, 4, 'ascii');
    parts.push(head);
    if (n.children) serialize(n.children, parts); else parts.push(n.raw);
  }
}

function leafRaw(node) { return node.raw; }           // full-box payload, including version/flags
const r32 = (buf, abs) => buf.readUInt32BE(abs);
const u32buf = n => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0, 0); return b; };
// MP4 is big-endian; Buffer.from(new Uint32Array([...]).buffer) would emit the host's LE bytes.
const u32arr = list => { const b = Buffer.alloc(list.length * 4); list.forEach((n, i) => b.writeUInt32BE(n >>> 0, i * 4)); return b; };

function fullBox(type, body, version = 0) {
  const head = Buffer.alloc(4);
  head.writeUInt8(version, 0);
  return { type, hdr: 8, children: null, raw: Buffer.concat([head, body]), abs: 0 };
}

// ---------- protobuf (proto3, fields per src/dashcam.proto) ----------
function varint(n) {
  const out = [];
  let v = BigInt(n);
  do { let b = Number(v & 0x7fn); v >>= 7n; if (v) b |= 0x80; out.push(b); } while (v);
  return Buffer.from(out);
}
// Tags are varints too, so field 16 wire 1 (=129) is TWO bytes (0x81 0x01), not a truncated 0x81.
const tag = (field, wire) => varint((field << 3) | wire);
const vfield = (f, v) => v ? Buffer.concat([tag(f, 0), varint(v)]) : Buffer.alloc(0);
function f32(f, v) { if (!v) return Buffer.alloc(0); const b = Buffer.alloc(4); b.writeFloatLE(v, 0); return Buffer.concat([tag(f, 5), b]); }   // protobuf fixed32 is little-endian
function f64(f, v) { if (!v) return Buffer.alloc(0); const b = Buffer.alloc(8); b.writeDoubleLE(v, 0); return Buffer.concat([tag(f, 1), b]); }  // protobuf fixed64 is little-endian

function encodeSeiMetadata(k) {
  const speed = +(4 + 18 * Math.sin((k / 150) * Math.PI * 0.9)).toFixed(3);   // m/s, > 0 everywhere
  return Buffer.concat([
    vfield(1, 1),                                    // version
    vfield(2, 1),                                    // gear_state = GEAR_DRIVE
    vfield(3, k),                                    // frame_seq_no
    f32(4, speed),                                   // vehicle_speed_mps
    f32(5, 0.35 + 0.2 * Math.sin(k / 11)),           // accelerator_pedal_position
    f32(6, 12 * Math.sin(k / 23)),                   // steering_wheel_angle
    vfield(7, k % 90 < 12 ? 1 : 0),                 // blinker_on_left
    vfield(9, k % 47 < 6 ? 1 : 0),                   // brake_applied
    vfield(10, k > 120 ? 3 : 0),                     // autopilot_state = TACC
    f64(11, 30.2741 + k * 1e-5),                     // latitude_deg
    f64(12, 120.1551 + k * 1.2e-5),                  // longitude_deg
    f64(13, (k * 0.7) % 360),                        // heading_deg
    f64(14, 0.5 * Math.sin(k / 9)),                  // linear_acceleration_mps2_x
    f64(15, -0.2),                                   // linear_acceleration_mps2_y
    f64(16, 9.81)                                    // linear_acceleration_mps2_z
  ]);
}

// H.264 emulation prevention: after two zero bytes, a following byte <= 0x03 gets an 0x03 stuffed.
function escapeRbsp(bytes) {
  const out = [];
  let zeros = 0;
  for (const b of bytes) {
    if (zeros >= 2 && b <= 0x03) { out.push(0x03); zeros = 0; }
    out.push(b);
    zeros = b === 0 ? zeros + 1 : 0;
  }
  return Buffer.from(out);
}

// SEI NAL as the upstream heuristic reads it: nal[1] === 5, a run of 0x42 from index 3, the first
// non-0x42 byte being 0x69, payload taken from there to length-1 (last byte is the RBSP stop bit).
function buildSeiNal(proto) {
  const uuid = Buffer.concat([Buffer.alloc(15, 0x42), Buffer.from([0x69])]);
  const rbsp = Buffer.concat([Buffer.from([0x05, 16 + proto.length]), uuid, proto]);
  const nal = Buffer.concat([Buffer.from([0x06]), escapeRbsp(rbsp), Buffer.from([0x80])]);
  return Buffer.concat([u32buf(nal.length), nal]);
}

// ---------- one camera ----------
function build(srcPath, outPath, frames) {
  const buf = fs.readFileSync(srcPath);
  const tree = parse(buf);
  const moov = find(tree, 'moov');
  const stbl = find(moov.children, 'stbl');
  const box = t => stbl.children.find(c => c.type === t);
  const mvhd = find(moov.children, 'mvhd'), tkhd = find(moov.children, 'tkhd'), mdhd = find(moov.children, 'mdhd');
  for (const [name, n] of [['mvhd', mvhd], ['tkhd', tkhd], ['mdhd', mdhd]]) if (!n) throw new Error(`missing ${name}`);
  const stts = box('stts'), stsz = box('stsz'), stsc = box('stsc'), stco = box('stco');
  if (!stts || !stsz || !stsc || !stco) throw new Error('missing st* box in ' + srcPath);
  const stss = box('stss');

  const timescale = r32(buf, mdhd.abs + mdhd.hdr + 12);
  const mvhdTimescale = r32(buf, mvhd.abs + mvhd.hdr + 12);
  // v0 durations: mvhd at +16, tkhd at +20, mdhd at +12 (all after version/flags + creation + modification)
  const durOff = { mvhd: 16, tkhd: 20, mdhd: 16 };
  for (const [n, off] of [[mvhd, durOff.mvhd], [tkhd, durOff.tkhd], [mdhd, durOff.mdhd]]) {
    if (n.raw[0] !== 0) throw new Error(`${n.type} is version ${n.raw[0]}, this generator only patches v0`);
  }

  const deltas = [];
  for (let i = 0, n = r32(buf, stts.abs + stts.hdr + 4); i < n; i++) {
    const count = r32(buf, stts.abs + stts.hdr + 8 + i * 8), delta = r32(buf, stts.abs + stts.hdr + 12 + i * 8);
    for (let j = 0; j < count; j++) deltas.push(delta);
  }

  const sampleCount = r32(buf, stsz.abs + stsz.hdr + 8);
  const defaultSize = r32(buf, stsz.abs + stsz.hdr + 4);
  const sizes = Array.from({ length: sampleCount }, (_, i) => defaultSize || r32(buf, stsz.abs + stsz.hdr + 12 + i * 4));

  // Expand stsc/stco into one byte range per sample. Each stsc entry covers the samples from its
  // firstSample up to the next entry's, split into chunks of perChunk that each start at their own
  // stco offset (chunk ids run sequentially across entries).
  const ranges = new Array(sampleCount).fill(null);
  const stscN = r32(buf, stsc.abs + stsc.hdr + 4);
  const stscEntries = Array.from({ length: stscN }, (_, i) => ({
    firstSample: r32(buf, stsc.abs + stsc.hdr + 8 + i * 12),
    perChunk: r32(buf, stsc.abs + stsc.hdr + 12 + i * 12),
    chunkIdx: r32(buf, stsc.abs + stsc.hdr + 16 + i * 12) - 1
  }));
  for (let e = 0; e < stscN; e++) {
    const ent = stscEntries[e];
    const lastSample = e + 1 < stscN ? Math.min(stscEntries[e + 1].firstSample - 1, sampleCount) : sampleCount;
    let sample = ent.firstSample - 1;
    const chunks = Math.ceil((lastSample - sample) / ent.perChunk);
    for (let c = 0; c < chunks; c++) {
      let off = r32(buf, stco.abs + stco.hdr + 8 + (ent.chunkIdx + c) * 4);
      for (let j = 0; j < ent.perChunk && sample < lastSample; j++, sample++) {
        ranges[sample] = { start: off, size: sizes[sample] };
        off += sizes[sample];
      }
    }
  }

  const sync = stss ? Array.from({ length: r32(buf, stss.abs + stss.hdr + 4) }, (_, i) => r32(buf, stss.abs + stss.hdr + 8 + i * 4)) : null;

  const N = Math.min(frames, sampleCount);
  const parts = [];
  const newSizes = [];
  const newDurations = [];
  let mediaDur = 0;
  for (let k = 0; k < N; k++) {
    const r = ranges[k];
    if (!r) throw new Error(`no byte range for sample ${k}`);
    const sei = buildSeiNal(encodeSeiMetadata(k + 1));
    const body = buf.subarray(r.start, r.start + r.size);
    parts.push(sei, body);
    newSizes.push(sei.length + r.size);
    newDurations.push(deltas[k] || 333);
    mediaDur += deltas[k] || 333;
  }
  const mdatBody = Buffer.concat(parts);

  const rle = [];
  for (const d of newDurations) {
    if (rle.length && rle[rle.length - 1].delta === d) rle[rle.length - 1].count++;
    else rle.push({ count: 1, delta: d });
  }
  const keepSync = (sync || []).filter(s => s <= N);
  const rebuilt = [
    fullBox('stts', Buffer.concat([u32buf(rle.length), u32arr(rle.flatMap(e => [e.count, e.delta]))])),
    fullBox('stsc', Buffer.concat([u32buf(1), u32arr([1, N, 1])])),
    fullBox('stsz', Buffer.concat([u32buf(0), u32buf(N), u32arr(newSizes)])),
    fullBox('stco', Buffer.concat([u32buf(1), u32buf(0)])),            // offset filled below
    ...(sync ? [fullBox('stss', Buffer.concat([u32buf(keepSync.length), u32arr(keepSync)]))] : [])
  ];
  for (const box2 of rebuilt) {
    const i = stbl.children.findIndex(c => c.type === box2.type);
    if (i >= 0) stbl.children[i] = box2;
    else {
      const order = ['stsd', 'stts', 'stss', 'ctts', 'stsc', 'stsz', 'stco'];
      const after = stbl.children.findIndex(c => order.indexOf(c.type) > order.indexOf(box2.type));
      if (after >= 0) stbl.children.splice(after, 0, box2); else stbl.children.push(box2);
    }
  }

  mvhd.raw.writeUInt32BE(Math.min(Math.round(mediaDur / timescale * mvhdTimescale), 0xffffffff), durOff.mvhd);
  tkhd.raw.writeUInt32BE(Math.min(Math.round(mediaDur / timescale * mvhdTimescale), 0xffffffff), durOff.tkhd);
  mdhd.raw.writeUInt32BE(Math.min(mediaDur, 0xffffffff), durOff.mdhd);
  const elst = find(moov.children, 'elst');
  if (elst && elst.raw[0] === 0 && r32(buf, elst.abs + elst.hdr + 4) >= 1) {
    elst.raw.writeUInt32BE(Math.min(Math.round(mediaDur / timescale * mvhdTimescale), 0xffffffff), 8 + 4 + 4);  // entry: duration, time
  }

  const headBytes = buf.subarray(0, find(tree, 'ftyp').abs + 8 + find(tree, 'ftyp').raw.length);
  const mdatBoxSize = 8 + mdatBody.length;
  // stco body is [version+flags 4B][entry_count 4B][offset 4B * n] — writing at byte 4 overwrites
  // the entry count and leaves every sample pointing at file offset 0 (the ftyp box).
  const stcoBox = stbl.children.find(c => c.type === 'stco');
  stcoBox.raw.writeUInt32BE(1, 4);
  stcoBox.raw.writeUInt32BE(headBytes.length + 8, 8);                   // chunk offset = mdat payload

  const moovParts = [];
  serialize([moov], moovParts);
  const out = Buffer.concat([headBytes, u32buf(mdatBoxSize), Buffer.from('mdat'), mdatBody, ...moovParts]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);

  // Walk the written file the way a demuxer would. The tables above can be internally consistent
  // and still point nowhere — that is exactly how the stco off-by-4-byte bug shipped six files that
  // the WebView only sometimes managed to decode.
  const written = fs.readFileSync(outPath);
  const wTree = parse(written);
  const wStco = find(wTree, 'stco'), wStsz = find(wTree, 'stsz');
  const bad = [];
  const chunkOff = r32(wStco.raw, 8);
  if (r32(wStco.raw, 4) !== 1) bad.push(`stco entry_count=${r32(wStco.raw, 4)}`);
  if (chunkOff !== headBytes.length + 8) bad.push(`stco offset=${chunkOff}, mdat payload=${headBytes.length + 8}`);
  if (r32(wStsz.raw, 8) !== N) bad.push(`stsz count=${r32(wStsz.raw, 8)} != ${N}`);
  // Sample 0 = [4B SEI length][SEI NAL][...the original sample bytes]. The second NAL depends on the
  // source: a keyframe sample carries in-band SPS/PPS ahead of its IDR slice, so the invariant worth
  // asserting is the one the app's parser actually relies on — the sample starts with the SEI and
  // contains exactly one VCL NAL.
  if ((written[chunkOff + 4] & 0x1f) !== 6) bad.push(`sample 0 starts with NAL type ${written[chunkOff + 4] & 0x1f}, expected SEI(6)`);
  const firstSize = r32(wStsz.raw, 12);
  const nalTypes = [];
  for (let p = chunkOff; p + 8 <= chunkOff + firstSize;) {
    const len = written.readUInt32BE(p);
    if (len < 1 || p + 4 + len > chunkOff + firstSize) { nalTypes.push('truncated'); break; }
    nalTypes.push(written[p + 4] & 0x1f);
    p += 4 + len;
  }
  const vcl = nalTypes.filter(t => t === 1 || t === 5).length;
  if (vcl !== 1) bad.push(`sample 0 has ${vcl} VCL NALs (types ${nalTypes.join(',')}), the walk assumes exactly 1`);
  const lastStart = chunkOff + newSizes.slice(0, N - 1).reduce((a, b) => a + b, 0);
  if (lastStart + r32(wStsz.raw, 12 + 4 * (N - 1)) > written.length) bad.push('last sample runs past the file');
  if (bad.length) throw new Error(`${path.basename(outPath)}: ${bad.join('; ')}`);

  const times = [];
  let acc = 0;
  for (let k = 0; k < N; k++) { times.push(+(acc / timescale).toFixed(6)); acc += newDurations[k]; }
  return { N, bytes: out.length, timescale, mediaDur, lastTime: times[times.length - 1], times };
}

// ---------- main ----------
const cameras = fs.readdirSync(SRC_DIR).filter(f => f.startsWith(SRC_STEM + '-') && f.endsWith('.mp4'));
if (!cameras.length) { console.error('no source clips in', SRC_DIR); process.exit(1); }
fs.mkdirSync(OUT_DIR, { recursive: true });
const report = [];
for (const f of cameras) {
  const camera = f.slice(SRC_STEM.length + 1, -4);
  const outPath = path.join(OUT_DIR, `${OUT_STEM}-${camera}.mp4`);
  const r = build(path.join(SRC_DIR, f), outPath, FRAMES);
  report.push({ camera, mb: +(r.bytes / 1048576).toFixed(2), frames: r.N, dur_s: +(r.mediaDur / r.timescale).toFixed(2), lastTime: r.lastTime });
  fs.writeFileSync(outPath + '.times.json', JSON.stringify(r.times));
}
console.log(JSON.stringify(report, null, 1));

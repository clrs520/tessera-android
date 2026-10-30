// R73-2 diagnosis: which auxiliary tables does the generator leave stale?
// The rebuilt file replaces stts/stsc/stsz/stco/stss with N=150 samples, but everything else in
// stbl is copied verbatim from a ~1800-sample source. Print, per file, every box whose entry counts
// imply a sample count, so the two cameras that fail to decode can be correlated with a structure
// difference instead of guessed at.
const fs = require('fs'), path = require('path');

const CONTAINERS = ['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'mvex', 'udta', 'mfra', 'mdri'];

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
      if (size < hdr || pos + size > end) break;
      const node = { type, hdr, abs: pos, size };
      if (CONTAINERS.includes(type)) node.children = walk(pos + hdr, pos + size);
      else node.raw = buf.subarray(pos + hdr, pos + size);
      out.push(node);
      pos += size;
    }
    return out;
  }
  return walk(0, buf.byteLength);
}

const r32 = (b, o) => b.length >= o + 4 ? b.readUInt32BE(o) : null;

function stblReport(node) {
  const out = {};
  for (const c of node.children || []) {
    const r = c.raw;
    if (!r) { out[c.type] = 'container'; continue; }
    switch (c.type) {
      case 'stsd': out.stsd = `${r32(r, 4)} sample desc`; break;
      case 'stts': {
        const n = r32(r, 4);
        let total = 0;
        for (let i = 0; i < n; i++) total += r32(r, 8 + i * 8);
        const uniq = new Set();
        for (let i = 0; i < n; i++) uniq.add(r32(r, 12 + i * 8));
        out.stts = `${n} runs / ${total} samples / deltas ${[...uniq].slice(0, 4).join(',')}`;
        out.stts_samples = total;
        break;
      }
      case 'stsc': {
        const n = r32(r, 4);
        out.stsc = `${n} entries (last firstSample=${r32(r, 8 + (n - 1) * 12)}, perChunk=${r32(r, 12 + (n - 1) * 12)})`;
        break;
      }
      case 'stsz': out.stsz = `default=${r32(r, 4)} count=${r32(r, 8)}`; out.stsz_samples = r32(r, 8); break;
      case 'stco': out.stco = `${r32(r, 4)} chunks`; break;
      case 'co64': out.co64 = `${r32(r, 4)} chunks`; break;
      case 'stss': out.stss = `${r32(r, 4)} sync`; break;
      case 'ctts': {
        const n = r32(r, 4);
        let total = 0;
        for (let i = 0; i < n; i++) total += r32(r, 8 + i * 8);
        out.ctts = `v${r[0]} ${n} runs / ${total} samples`; out.ctts_samples = total;
        break;
      }
      case 'sdtp': out.sdtp = `${r.length} bytes`; out.sdtp_samples = r.length; break;
      case 'sgpd': out.sgpd = `v${r[0]} groupingType=${r.subarray(4, 8).toString('ascii')} defaultLen=${r32(r, 9)}`; break;
      case 'sbgp': {
        const n = r32(r, 4);
        let total = 0;
        for (let i = 0; i < n; i++) total += r32(r, 8 + i * 8);
        out.sbgp = `${n} runs / ${total} samples`; out.sbgp_samples = total;
        break;
      }
      case 'elst': out.elst = `v${r[0]} ${r32(r, 4)} entries`; break;
      default: out[c.type] = `${r.length} B`;
    }
  }
  return out;
}

const dirs = process.argv.slice(2);
for (const dir of dirs) {
  console.log(`\n=== ${dir}`);
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.mp4')).sort()) {
    const buf = fs.readFileSync(path.join(dir, f));
    const tree = parse(buf);
    const top = tree.map(n => n.type).join(' ');
    const moov = tree.find(n => n.type === 'moov');
    const traks = (moov?.children || []).filter(n => n.type === 'trak');
    console.log(`\n${f}  (${(buf.length / 1e6).toFixed(1)} MB)  top: ${top}`);
    for (const t of traks) {
      const hdlr = (t.children.find(n => n.type === 'mdia')?.children || []).find(n => n.type === 'hdlr');
      const kind = hdlr ? hdlr.raw.subarray(8, 12).toString('ascii') : '?';
      const stbl = (t.children.find(n => n.type === 'mdia')?.children || [])
        .find(n => n.type === 'minf')?.children.find(n => n.type === 'stbl');
      console.log(`  trak handler=${kind}`);
      console.log('   ', JSON.stringify(stblReport(stbl || { children: [] })));
    }
  }
}

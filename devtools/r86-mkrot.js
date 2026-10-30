// Make a rotated clone of an MP4 the way a phone camera does it: the coded samples stay put and
// only the tkhd transform says "display me turned". That is the whole reason a thumbnail pipeline
// can look fine on a desktop player and sideways on a native frame grabber — the rotation is
// metadata, not pixels.
//
//   node devtools/r86-mkrot.js <in.mp4> <out.mp4> <0|90|180|270>
import { readFileSync, writeFileSync } from 'node:fs';

const [, , src, dst, degArg] = process.argv;
const degrees = Number(degArg);
if (![0, 90, 180, 270].includes(degrees)) {
    throw new Error('degrees must be 0, 90, 180 or 270');
}
const buf = readFileSync(src);
const CONTAINERS = /^(moov|trak|mdia|minf|stbl)$/;
const boxes = [];

function walk(start, end, depth = 0) {
    let offset = start;
    while (offset + 8 <= end) {
        let size = buf.readUInt32BE(offset);
        let header = 8;
        const type = buf.toString('latin1', offset + 4, offset + 8);
        if (size === 1) { size = Number(buf.readBigUInt64BE(offset + 8)); header = 16; }
        if (size < header || offset + size > end) return;
        boxes.push({ type, at: offset + header, end: offset + size, depth });
        if (CONTAINERS.test(type)) walk(offset + header, offset + size, depth + 1);
        offset += size;
    }
}
walk(0, buf.length);

// ISO/IEC 14496-12 transform cells a,b,u,c,d,v,k,l,m: a–d are 16.16, the rest 2.30. The clockwise
// rotation by θ is a=cosθ, b=sinθ, c=-sinθ, d=cosθ.
const F16 = 65536;
const F30 = 1 << 30;
const table = {
    0: [F16, 0, 0, 0, F16, 0, 0, 0, F30],
    90: [0, F16, 0, -F16, 0, 0, 0, 0, F30],
    180: [-F16, 0, 0, 0, -F16, 0, 0, 0, F30],
    270: [0, -F16, 0, F16, 0, 0, 0, 0, F30],
}[degrees];

let patched = 0;
for (const trak of boxes.filter((b) => b.type === 'trak')) {
    const inside = boxes.filter((b) => b.depth > trak.depth && b.at >= trak.at && b.end <= trak.end);
    const hdlr = inside.find((b) => b.type === 'hdlr');
    if (!hdlr || buf.toString('latin1', hdlr.at + 8, hdlr.at + 12) !== 'vide') continue;
    const tkhd = inside.find((b) => b.type === 'tkhd');
    const version = buf[tkhd.at];
    // ver/flags 4, then cmt/mtd/trkID/reserved/duration (20 for v0, 32 for v1), reserved 8,
    // layer+alt+volume+reserved 8.
    const matrixAt = tkhd.at + 4 + (version === 1 ? 32 : 20) + 8 + 8;
    // Refuse to guess: the identity transform must actually be where the spec puts it.
    const isIdentity = buf.readInt32BE(matrixAt) === F16
        && buf.readInt32BE(matrixAt + 4) === 0
        && buf.readInt32BE(matrixAt + 16) === F16
        && buf.readInt32BE(matrixAt + 32) === F30;
    if (!isIdentity) throw new Error(`tkhd@${matrixAt} is not an identity transform, aborting`);
    table.forEach((value, i) => buf.writeInt32BE(value, matrixAt + i * 4));
    patched += 1;
}
if (!patched) throw new Error('no video track found');
writeFileSync(dst, buf);
console.log(`patched ${patched} video track(s) to ${degrees}° -> ${dst}`);

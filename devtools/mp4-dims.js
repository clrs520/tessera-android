// Read the two sizes an MP4 carries: the sample description's coded width/height (what the
// bitstream actually is, macroblock-aligned) and the track header's display width/height (what a
// player scales it to). They differ whenever an encoder rounded the frame up, and that difference
// is exactly the fraction a compositor sizing its cell from the coded dims stretches the picture by.
//
//   node devtools/mp4-dims.js <file>
import { readFileSync } from 'node:fs';

const buf = readFileSync(process.argv[2]);
const CONTAINERS = /^(moov|trak|mdia|minf|stbl)$/;

function walk(start, end, out) {
    let offset = start;
    while (offset + 8 <= end) {
        let size = buf.readUInt32BE(offset);
        let header = 8;
        const type = buf.toString('latin1', offset + 4, offset + 8);
        if (size === 1) {
            size = Number(buf.readBigUInt64BE(offset + 8));
            header = 16;
        }
        if (size < header || offset + size > end) return;
        out.push({ type, at: offset + header, end: offset + size });
        if (CONTAINERS.test(type)) walk(offset + header, offset + size, out);
        offset += size;
    }
}

const boxes = [];
walk(0, buf.length, boxes);

function tkhd(at) {
    const version = buf[at];
    // version+flags, then (v1 ? 8:4)*3 cmt/mtd/trk, reserved, group, layers, alt, matrix(36),
    // and the two 16.16 display dims.
    const base = at + 4 + (version === 1 ? 3 * 8 : 3 * 4) + 4 + 2 + 2 + 4 + 36;
    return { w: buf.readUInt32BE(base) / 65536, h: buf.readUInt32BE(base + 4) / 65536 };
}

function stsd(at) {
    const entry = at + 8;
    return {
        codec: buf.toString('latin1', entry + 4, entry + 8),
        w: buf.readUInt16BE(entry + 8 + 24),
        h: buf.readUInt16BE(entry + 8 + 26),
    };
}

const tracks = [];
boxes.filter((b) => b.type === 'trak').forEach((trak) => {
    const inside = [];
    walk(trak.at, trak.end, inside);
    const hdlr = inside.find((b) => b.type === 'hdlr');
    const kind = hdlr ? buf.toString('latin1', hdlr.at + 8, hdlr.at + 12) : '?';
    const tk = inside.find((b) => b.type === 'tkhd');
    const sd = inside.find((b) => b.type === 'stsd');
    if (!tk || !sd) return;
    tracks.push({ kind, display: tkhd(tk.at), coded: stsd(sd.at) });
});

tracks.forEach((t) => {
    const dw = t.display.w || t.coded.w;
    const dh = t.display.h || t.coded.h;
    const codedAspect = t.coded.w / t.coded.h;
    const displayAspect = dw / dh;
    console.log(`${t.kind}  coded ${t.coded.w}x${t.coded.h} (${t.coded.codec}) aspect ${codedAspect.toFixed(4)}`
        + `  |  display ${dw}x${dh} aspect ${displayAspect.toFixed(4)}`
        + `  |  coded/display ${((codedAspect / displayAspect - 1) * 100).toFixed(2)}%`);
});

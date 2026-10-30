// Everything an MP4 can say about how big the picture is, in one dump: the tkhd matrix and display
// dims, the stsd entry's coded dims, and the boxes inside it that change the *aspect* without
// changing the sample size (`pasp` pixel-aspect, `prof`, plus the AVC SPS' own conformance window).
//
//   node devtools/mp4-geometry.js <file>
import { readFileSync } from 'node:fs';

const buf = readFileSync(process.argv[2]);
const CONTAINERS = /^(moov|trak|mdia|minf|stbl)$/;

function walk(start, end, out, depth = 0) {
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
        const box = { type, at: offset + header, end: offset + size, depth };
        out.push(box);
        if (CONTAINERS.test(type)) walk(offset + header, offset + size, out, depth + 1);
        offset += size;
    }
}

const boxes = [];
walk(0, buf.length, boxes);

for (const tk of boxes.filter((b) => b.type === 'trak')) {
    const inside = boxes.filter((b) => b.depth > tk.depth && b.at >= tk.at && b.end <= tk.end);
    const hdlr = inside.find((b) => b.type === 'hdlr');
    if (!hdlr) continue;
    const kind = buf.toString('latin1', hdlr.at + 8, hdlr.at + 12);
    if (kind !== 'vide') continue;

    const tkhd = inside.find((b) => b.type === 'tkhd');
    const v = buf[tkhd.at];
    // ver/flags, creation, modification, duration, reserved, layer, alt-group, volume, reserved,
    // then the 9x 4-byte matrix.
    const mBase = tkhd.at + 4 + (v === 1 ? 3 * 8 : 3 * 4) + 4 + 2 + 2 + 2 + 2;
    const matrix = [];
    for (let i = 0; i < 9; i++) {
        const raw = buf.readInt32BE(mBase + i * 4);
        // 16.16 for elements 0,1,3,4 and 2.30 for the translation pair.
        matrix.push(i === 6 || i === 7 ? raw / 16384 : raw / 65536);
    }
    const dBase = mBase + 36;
    const dispW = buf.readUInt32BE(dBase) / 65536;
    const dispH = buf.readUInt32BE(dBase + 4) / 65536;

    const stsd = inside.find((b) => b.type === 'stsd');
    const entry = stsd.at + 8;
    const codec = buf.toString('latin1', entry + 4, entry + 8);
    const codedW = buf.readUInt16BE(entry + 8 + 24);
    const codedH = buf.readUInt16BE(entry + 8 + 26);
    // VisualSampleEntry is 86 bytes (8 header + 6 reserved + 2 dref + 6 + 12 pre_defined + 2 w + 2 h
    // + 8 res + 4 reserved + 2 frame_count + 32 compressorname + 2 depth + 2 pre_defined); its
    // child boxes — `pasp` among them — start after that, not after 78.
    const children = [];
    walk(entry + 86, stsd.end, children);

    console.log(`${kind}  stsd ${codedW}x${codedH} (${codec})  tkhd display ${dispW}x${dispH}`);
    console.log(`  matrix ${matrix.map((n) => n.toFixed(4)).join(' ')}`);
    for (const c of children) {
        if (c.type === 'pasp') {
            console.log(`  pasp hSpacing=${buf.readUInt32BE(c.at)} vSpacing=${buf.readUInt32BE(c.at + 4)}`
                + `  -> aspect x ${(buf.readUInt32BE(c.at) / buf.readUInt32BE(c.at + 4)).toFixed(4)}`);
        } else if (c.type === 'avcC') {
            const spsLen = buf.readUInt16BE(c.at + 4);
            const sps = buf.subarray(c.at + 6, c.at + 6 + spsLen);
            console.log(`  avcC spc profile=${sps[1]} sps[0]=0x${sps.toString('hex').slice(0, 24)}`);
            console.log(`  stsd children: ${children.map((x) => x.type).join(', ')}`);
        } else if (c.type !== 'avcC') {
            console.log(`  child ${c.type} (${c.end - c.at}B)`);
        }
    }
    const sar = dispW && dispH ? dispW / dispH : codedW / codedH;
    console.log(`  coded aspect ${(codedW / codedH).toFixed(4)}  display aspect ${sar.toFixed(4)}`
        + `  diff ${((codedW / codedH / sar - 1) * 100).toFixed(2)}%`);
}

// Dump every tkhd's raw tail so the matrix and display-dim offsets can be pinned by eye instead of
// by trusting one muxer's layout.   node devtools/r86-tkhd.js <file>
import { readFileSync } from 'node:fs';

const buf = readFileSync(process.argv[2]);
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
        boxes.push({ type, at: offset + header, size, end: offset + size, boxAt: offset, depth });
        if (CONTAINERS.test(type)) walk(offset + header, offset + size, depth + 1);
        offset += size;
    }
}
walk(0, buf.length);

for (const tk of boxes.filter((b) => b.type === 'tkhd')) {
    const v = buf[tk.at];
    const fixed = v === 1 ? 8 : 4;
    // ver/flags | creation | modification | track_ID | reserved | duration | reserved(8) |
    // layer | alt | volume | reserved | matrix(36) | width(16.16) | height(16.16)
    const mSpec = tk.at + 4 + fixed * 2 + 4 + 4 + fixed + 8 + 2 + 2 + 2 + 2;
    const tail = buf.subarray(mSpec, tk.end);
    console.log(`tkhd v${v} box@${tk.boxAt} size=${tk.size} content=${tk.end - tk.at} matrix@${mSpec}`);
    const ints = [];
    for (let i = 0; i + 4 <= tail.length; i += 4) ints.push(buf.readInt32BE(mSpec + i));
    console.log(`  ints after matrix-offset: ${ints.map((n) => `0x${(n >>> 0).toString(16).padStart(8, '0')}`).join(' ')}`);
    // a,b,c,d are 16.16; u,v,k,l,m are 2.30.
    console.log(`  ISO a=${(ints[0] / 65536).toFixed(3)} b=${(ints[1] / 65536).toFixed(3)} ` +
        `c=${(ints[3] / 65536).toFixed(3)} d=${(ints[4] / 65536).toFixed(3)} ` +
        `u=${(ints[2] / (1 << 30)).toFixed(3)} v=${(ints[5] / (1 << 30)).toFixed(3)}`);
    // The 36-byte identity transform, if present anywhere in this box, is unambiguous.
    // ISO cell order a,b,u,c,d,v,k,l,m with a,b,c,d in 16.16 and the rest in 2.30:
    // identity = 0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000.
    const IDENTITY = Buffer.from([
        0x00, 0x01, 0x00, 0x00, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0x00, 0x01, 0x00, 0x00, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0x40, 0x00, 0x00, 0x00,
    ]);
    const found = buf.indexOf(IDENTITY, tk.at, 'ascii');
    console.log(`  identity-matrix found at ${found} (delta from spec offset: ${found < 0 ? 'n/a' : found - mSpec})`);
}

// Crop a rectangle out of a PNG and write it back as a PNG, so a 1080x2402 frame can be looked at
// at 1:1 instead of being squashed into a thumbnail. Filter type 0 + zlib is enough.
//   node devtools/png-crop.mjs in.png out.png x0,y0,x1,y1 [scale]
import { writeFileSync } from 'node:fs';
import zlib from 'node:zlib';
import { decodePng } from './png-diff.mjs';

const [src, dst, boxArg, scaleArg] = process.argv.slice(2);
const [x0, y0, x1, y1] = boxArg.split(',').map(Number);
const scale = Number(scaleArg || 1);

const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});
const crc32 = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, body])));
    return Buffer.concat([len, t, body, crc]);
};

const img = decodePng(src);
const w = Math.round((x1 - x0) * scale), h = Math.round((y1 - y0) * scale);
const raw = Buffer.alloc(h * (1 + w * 4));
for (let y = 0; y < h; y += 1) {
    const sy = Math.min(img.height - 1, y0 + Math.floor(y / scale));
    raw[y * (1 + w * 4)] = 0;
    for (let x = 0; x < w; x += 1) {
        const sx = Math.min(img.width - 1, x0 + Math.floor(x / scale));
        const o = (sy * img.width + sx) * 4, p = y * (1 + w * 4) + 1 + x * 4;
        raw[p] = img.rgba[o]; raw[p + 1] = img.rgba[o + 1]; raw[p + 2] = img.rgba[o + 2]; raw[p + 3] = 255;
    }
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
writeFileSync(dst, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
]));
console.log(`${dst} ${w}x${h}`);

// Minimal PNG reader + differ, so "the glass bends the picture" can be answered with pixels rather
// than by reasoning about a filter graph. No third-party decoder: node's zlib is enough for the
// 8-bit non-interlaced PNGs CDP hands back.
import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

export function decodePng(path) {
    const buf = readFileSync(path);
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path} is not a PNG`);
    let off = 8, ihdr = null, idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.toString('ascii', off + 4, off + 8);
        const body = buf.subarray(off + 8, off + 8 + len);
        if (type === 'IHDR') {
            ihdr = { width: body.readUInt32BE(0), height: body.readUInt32BE(4),
                depth: body[8], color: body[9], interlace: body[12] };
        } else if (type === 'IDAT') idat.push(body);
        else if (type === 'IEND') break;
        off += 12 + len;
    }
    if (!ihdr || ihdr.depth !== 8 || ihdr.interlace !== 0) {
        throw new Error(`${path}: only 8-bit non-interlaced supported (${JSON.stringify(ihdr)})`);
    }
    const ch = ihdr.color === 6 ? 4 : ihdr.color === 2 ? 3 : ihdr.color === 0 ? 1 : -1;
    if (ch < 0) throw new Error(`${path}: colour type ${ihdr.color} unsupported`);
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const stride = ihdr.width * ch;
    const out = Buffer.alloc(ihdr.width * ihdr.height * 4);
    let prev = Buffer.alloc(stride);
    for (let y = 0; y < ihdr.height; y += 1) {
        const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride));
        const f = raw[y * (stride + 1)];
        for (let x = 0; x < stride; x += 1) {
            const a = x >= ch ? line[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
            if (f === 1) line[x] = (line[x] + a) & 255;
            else if (f === 2) line[x] = (line[x] + b) & 255;
            else if (f === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
            else if (f === 4) line[x] = (line[x] + paeth(a, b, c)) & 255;
            else if (f !== 0) throw new Error(`${path}: filter type ${f}`);
        }
        for (let x = 0; x < ihdr.width; x += 1) {
            const o = (y * ihdr.width + x) * 4;
            out[o] = line[x * ch]; out[o + 1] = line[x * ch + 1]; out[o + 2] = line[x * ch + 2];
            out[o + 3] = ch === 4 ? line[x * ch + 3] : 255;
        }
        prev = line;
    }
    return { width: ihdr.width, height: ihdr.height, rgba: out };
}

// Reports the RGB difference over a rectangle given in *device* pixels. `over` is what changed,
// `bbox` where it changed — a uniform shift and a real lens both move pixels, but only a lens
// leaves a warped edge that does not appear anywhere else in the frame.
export function diffPng(pathA, pathB, box) {
    const a = decodePng(pathA), b = decodePng(pathB);
    if (a.width !== b.width || a.height !== b.height) {
        throw new Error(`size mismatch ${a.width}x${a.height} vs ${b.width}x${b.height}`);
    }
    const [x0, y0, x1, y1] = box ?? [0, 0, a.width, a.height];
    let sum = 0, max = 0, n = 0, moved = 0;
    let lx0 = 1e9, ly0 = 1e9, lx1 = -1, ly1 = -1;
    for (let y = Math.max(0, y0); y < Math.min(a.height, y1); y += 1) {
        for (let x = Math.max(0, x0); x < Math.min(a.width, x1); x += 1) {
            const o = (y * a.width + x) * 4;
            const d = Math.max(Math.abs(a.rgba[o] - b.rgba[o]),
                Math.abs(a.rgba[o + 1] - b.rgba[o + 1]),
                Math.abs(a.rgba[o + 2] - b.rgba[o + 2]));
            sum += d; n += 1;
            if (d > max) max = d;
            if (d > 8) {
                moved += 1;
                if (x < lx0) lx0 = x; if (x > lx1) lx1 = x;
                if (y < ly0) ly0 = y; if (y > ly1) ly1 = y;
            }
        }
    }
    return { size: `${a.width}x${a.height}`, box: [x0, y0, x1, y1],
        mean: +(sum / Math.max(1, n)).toFixed(3), max, movedPx: moved,
        movedPct: +(100 * moved / Math.max(1, n)).toFixed(2),
        bbox: moved ? [lx0, ly0, lx1, ly1] : null };
}

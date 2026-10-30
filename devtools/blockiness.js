// Blockiness probe: a mosaic region is constant inside every 80x80 cell, so the
// per-cell luminance range collapses to (near) zero while the encoder noise floor keeps it above 0.
const fs = require('fs');
const W = 720, H = 1600, B = parseInt(process.argv[3] || '80', 10);
const buf = fs.readFileSync(process.argv[2]);
function lum(x, y) { const i = (y * W + x) * 3; return (buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000; }
function stats(x0, y0, x1, y1) {
    let cells = 0, flat = 0, ranges = [];
    for (let cy = y0; cy + B <= y1; cy += B) {
        for (let cx = x0; cx + B <= x1; cx += B) {
            let mn = 999, mx = -1;
            for (let y = cy; y < cy + B; y += 2) for (let x = cx; x < cx + B; x += 2) {
                const v = lum(x, y); if (v < mn) mn = v; if (v > mx) mx = v;
            }
            cells++; ranges.push(mx - mn); if (mx - mn <= 6) flat++;
        }
    }
    // adjacent-pixel edge density: fine text scores high, a flat block scores ~0
    let edge = 0, tot = 0;
    for (let y = y0; y < y1; y += 3) for (let x = x0; x + 1 < x1; x++) {
        tot++; if (Math.abs(lum(x, y) - lum(x + 1, y)) > 10) edge++;
    }
    return { cells, flat, flatPct: cells ? Math.round(100 * flat / cells) : 0, edgePct: tot ? +(100 * edge / tot).toFixed(2) : 0 };
}
const boxes = JSON.parse(process.argv[4] || '[]');
console.log('whole  ', JSON.stringify(stats(0, 0, W, H)));
for (const b of boxes) console.log(JSON.stringify(b), JSON.stringify(stats(b[0], b[1], b[2], b[3])));

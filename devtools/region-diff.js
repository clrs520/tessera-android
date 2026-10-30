// Region-by-region difference between two exported frames of the same clip, so "the mosaic did
// something" becomes a number: inside each box the two files must disagree, outside they must not.
const fs = require('fs');
const W = parseInt(process.argv[2], 10), H = parseInt(process.argv[3], 10);
const a = fs.readFileSync(process.argv[4]), b = fs.readFileSync(process.argv[5]);
function lum(buf, x, y) { const i = (y * W + x) * 3; return (buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000; }
function diff(x0, y0, x1, y1) {
    let sum = 0, n = 0, max = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const d = Math.abs(lum(a, x, y) - lum(b, x, y));
        sum += d; n++; if (d > max) max = d;
    }
    return { mean: +(sum / n).toFixed(2), max };
}
const regions = JSON.parse(process.argv[6] || '[]');
for (const r of regions) console.log(JSON.stringify(r), JSON.stringify(diff(r[0], r[1], r[2], r[3])));

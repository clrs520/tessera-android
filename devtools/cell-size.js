// Which cell size explains the mosaicked region? For each candidate, average the within-block
// luminance standard deviation over whole blocks tiled from the box's own origin — that is where the
// shader anchors its grid (`box.xy + (floor(local/uBlock)+0.5)*uBlock`). The real cell size collapses
// the variance to encoder noise; the wrong one leaves the source's texture.
const fs = require('fs');
const W = parseInt(process.argv[2], 10);
const buf = fs.readFileSync(process.argv[3]);
const [x0, y0, x1, y1] = JSON.parse(process.argv[4]);
const sizes = (process.argv[5] || '40,50,60,80,100').split(',').map(Number);
function lum(x, y) { const i = (y * W + x) * 3; return (buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000; }
function score(s) {
    let acc = 0, n = 0;
    for (let by = y0; by + s <= y1; by += s) {
        for (let bx = x0; bx + s <= x1; bx += s) {
            let sum = 0, cnt = 0;
            for (let y = by; y < by + s; y += 2) for (let x = bx; x < bx + s; x += 2) { sum += lum(x, y); cnt++; }
            const mean = sum / cnt;
            let v = 0;
            for (let y = by; y < by + s; y += 2) for (let x = bx; x < bx + s; x += 2) { v += (lum(x, y) - mean) ** 2; }
            acc += Math.sqrt(v / cnt); n++;
        }
    }
    return { std: +(acc / (n || 1)).toFixed(2), blocks: n };
}
const out = {};
for (const s of sizes) out[s] = score(s);
console.log(JSON.stringify(out));

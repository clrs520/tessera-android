// Prove the mosaic cell size, not just its presence: walk a line through a mosaicked box and report
// the x positions where the luminance steps, then factor them by the expected cell width.
const fs = require('fs');
const W = parseInt(process.argv[2], 10), H = parseInt(process.argv[3], 10);
const buf = fs.readFileSync(process.argv[4]);
const y = parseInt(process.argv[5], 10);
const x0 = parseInt(process.argv[6], 10), x1 = parseInt(process.argv[7], 10);
const cell = parseFloat(process.argv[8]);
function lum(x, yy) { const i = (yy * W + x) * 3; return (buf[i] * 299 + buf[i + 1] * 587 + buf[i + 2] * 114) / 1000; }
const steps = [];
for (let x = x0 + 1; x < x1; x++) {
    if (Math.abs(lum(x, y) - lum(x - 1, y)) > 12) steps.push(x);
}
const rel = steps.map(x => +(x / cell).toFixed(3));
console.log(JSON.stringify({
    y, x0, x1, cell,
    stepX: steps,
    stepOverCell: rel,
    maxDevFromGrid: steps.length ? Math.max(...rel.map(v => Math.abs(v - Math.round(v)))) : null
}));

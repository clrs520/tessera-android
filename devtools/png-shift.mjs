// Is the difference a *lens* or just the whole backdrop slid over by a constant? A uniform shift is
// invisible under a 16px blur but it is not the effect we asked for, so find the shift that best
// explains the difference and report what is left over.
//
//   node devtools/png-shift.mjs a.png b.png x0,y0,x1,y1 [maxShift]
import { decodePng } from './png-diff.mjs';

const [a, b, boxArg, maxArg] = process.argv.slice(2);
const [x0, y0, x1, y1] = boxArg.split(',').map(Number);
const maxShift = Number(maxArg || 24);
const A = decodePng(a), B = decodePng(b);

const meanAt = (dx, dy) => {
    let sum = 0, n = 0;
    for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
            const sx = x + dx, sy = y + dy;
            if (sx < 0 || sy < 0 || sx >= A.width || sy >= A.height) continue;
            const oa = (y * A.width + x) * 4, ob = (sy * B.width + sx) * 4;
            sum += Math.abs(A.rgba[oa] - B.rgba[ob]) + Math.abs(A.rgba[oa + 1] - B.rgba[ob + 1])
                + Math.abs(A.rgba[oa + 2] - B.rgba[ob + 2]);
            n += 1;
        }
    }
    return { m: sum / Math.max(1, n) / 3, n };
};

const zero = meanAt(0, 0);
let best = { dx: 0, dy: 0, ...zero };
for (let dy = -maxShift; dy <= maxShift; dy += 1) {
    for (let dx = -maxShift; dx <= maxShift; dx += 1) {
        if (!dx && !dy) continue;
        const r = meanAt(dx, dy);
        if (r.m < best.m) best = { dx, dy, ...r };
    }
}
const explained = zero.m > 0 ? 100 * (1 - best.m / zero.m) : 0;
console.log(`${a} vs ${b}  box=${boxArg}`);
console.log(`  原位差 mean=${zero.m.toFixed(2)}  最优平移 (dx=${best.dx}, dy=${best.dy}) 后 mean=${best.m.toFixed(2)}`);
console.log(`  一次整体平移能解释 ${explained.toFixed(1)}% 的差；${explained > 85
    ? '剩下的是噪声 ⇒ 这个滤镜基本只是把后景整体挪了一下，不是边缘透镜'
    : '剩下的是挪不掉的形变 ⇒ 有真实的非均匀折射'}`);

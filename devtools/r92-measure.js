// R92: measures an already-exported file (no re-encode) — one row per sampled second, giving the
// number's ink span and where the unit starts. `node devtools/r92-measure.js <file name>`.
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const name = process.argv[2];
if (!name) { console.log('usage: r92-measure.js <Tessera_*.mp4>'); process.exit(1); }

const expression = `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ATs = [300, 1300, 2300, 3300, 4300, 5100];
    const nativeThumb = (path, millis) => new Promise((resolve) => {
        const id = 'r92m' + Math.random().toString(36).slice(2, 7);
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        const finish = (value) => { if (!done) { done = true; resolve(value); } };
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id) finish(typeof dataUrl === 'string' ? dataUrl : null);
        };
        setTimeout(() => finish(null), 25000);
        for (let i = 0; i < 4; i += 1) {
            try { window.TDashcamNative.requestThumb(id, path, millis, 1100); return; }
            catch (e) { if (i === 3) finish(null); }
        }
    });
    const frame = async (at) => {
        const src = await nativeThumb('/storage/emulated/0/Download/${name}', at);
        if (!src) return null;
        return await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve({ w: canvas.width, h: canvas.height,
                    data: ctx.getImageData(0, 0, canvas.width, canvas.height).data });
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    };
    const luma = (f, x, y) => {
        const i = (y * f.w + x) * 4;
        return (f.data[i] * 299 + f.data[i + 1] * 587 + f.data[i + 2] * 114) / 1000;
    };
    const rows = [];
    for (const at of ATs) {
        const f = await frame(at);
        if (!f) { rows.push({ at, fatal: 'no frame' }); continue; }
        const top = Math.round(f.h * 0.02), bottom = Math.round(f.h * 0.14);
        const any = [], extent = [];
        for (let x = 0; x < f.w; x += 1) {
            let hit = 0, first = -1, last = -1;
            for (let y = top; y < bottom; y += 1) {
                if (luma(f, x, y) >= 150) { hit += 1; if (first < 0) first = y; last = y; }
            }
            any.push(hit);
            extent.push(hit > 0 ? last - first + 1 : 0);
        }
        const maxE = Math.max(...extent);
        let nL = -1, nR = -1;
        for (let x = 0; x < f.w; x += 1) {
            if (extent[x] < maxE * 0.75) continue;
            if (nL < 0) nL = x;
            nR = x;
        }
        let unitL = -1;
        for (let x = nR + 1; x < f.w; x += 1) if (any[x]) { unitL = x; break; }
        let clockR = -1;
        for (let x = nL - 1; x >= 0; x -= 1) if (any[x]) { clockR = x; break; }
        rows.push({ at, thumb: f.w, maxE, number: [nL, nR], unitLeft: unitL,
            gap: nR >= 0 && unitL >= 0 ? unitL - nR - 1 : null,
            numberFrac: nL >= 0 ? [+(nL / f.w).toFixed(4), +(nR / f.w).toFixed(4)] : null,
            unitFrac: unitL >= 0 ? +(unitL / f.w).toFixed(4) : null });
    }
    return JSON.stringify({ name: '${name}', rows });
})()`;

const raw = execFileSync('node', ['devtools/cdp-eval.mjs', expression], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, CDP_TIMEOUT_MS: '180000' },
}).trim();
let j;
try { j = JSON.parse(raw); } catch { console.log('RAW ' + raw.slice(0, 300)); process.exit(1); }
j.rows.forEach((r) => {
    if (r.fatal) { console.log(`  @${r.at}ms ${r.fatal}`); return; }
    console.log(`  @${String(r.at).padStart(4)}ms  数字 ${JSON.stringify(r.number)}`
        + `  单位 ${String(r.unitLeft).padStart(4)}  间隙 ${String(r.gap).padStart(3)}`
        + `  字高 ${r.maxE}  分数 ${JSON.stringify(r.numberFrac)}/${r.unitFrac}`);
});
const ok = j.rows.filter((r) => Number.isFinite(r.gap));
if (ok.length >= 4) {
    const gaps = ok.map((r) => r.gap), rights = ok.map((r) => r.numberFrac[1]);
    const lefts = ok.map((r) => r.numberFrac[0]), units = ok.map((r) => r.unitFrac);
    console.log('verdict ' + JSON.stringify({
        '间隙逐秒一致（≤ 3px）': Math.max(...gaps) - Math.min(...gaps) <= 3,
        '间隙紧（≤ 16px @1100 宽）': Math.max(...gaps) <= 16,
        '数字右沿钉住（≤ 0.6% 宽）': Math.max(...rights) - Math.min(...rights) <= 0.006,
        '数字左沿会走（右对齐签名）': Math.max(...lefts) - Math.min(...lefts) > 0.004,
        '单位钉在同一列（≤ 0.2% 宽）': Math.max(...units) - Math.min(...units) <= 0.002,
    }));
}

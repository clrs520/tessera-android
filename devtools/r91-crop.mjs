// R91 visual evidence, second pass: the full frame is 600px wide when it lands here, so the 左上
// camera chip and the first stamp row are a few pixels apart and unreadable. This pulls the same
// frame through the app's own retriever (no ffmpeg on this machine) and writes a 3× crop of the
// top-left corner — the one place the two layers share a corner. Reads no URL, prints no token.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CROP = { x: Number(process.env.R92_X ?? 0), y: Number(process.env.R92_Y ?? 0),
    w: Number(process.env.R92_W ?? 0.34), h: Number(process.env.R92_H ?? 0.22),
    scale: Number(process.env.R92_S ?? 3) };
// [file, out, millis]. The chrome plate is latched off the first *composited* frame, so on a loaded
// emulator it can join the file a second or two in — an early sample shows the stamp and no chip.
const FILES = [
    ['Tessera_2026-10-09_10-00-00_0.0-1.6s_1c_1104x720.mp4', 'r92-row-before.png', 300],
];

for (const [name, out, at] of FILES) {
    const expression = `(async () => {
        const id = 'r91c' + Math.random().toString(36).slice(2, 7);
        const url = await new Promise((resolve) => {
            let done = false;
            const previous = window.__tdashcamNativeThumb;
            window.__tdashcamNativeThumb = (got, data) => {
                if (previous) previous(got, data);
                if (got === id && !done) { done = true; resolve(typeof data === 'string' ? data : null); }
            };
            setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
            window.TDashcamNative.requestThumb(id, '/storage/emulated/0/Download/${name}', ${at ?? 800}, 1100);
        });
        if (!url) return 'NO FRAME';
        const img = new Image();
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = url; });
        const c = ${JSON.stringify(CROP)};
        const sx = Math.round(c.x * img.width), sy = Math.round(c.y * img.height);
        const sw = Math.round(c.w * img.width), sh = Math.round(c.h * img.height);
        const canvas = document.createElement('canvas');
        canvas.width = sw * c.scale; canvas.height = sh * c.scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        return JSON.stringify({ src: [img.width, img.height], crop: [sx, sy, sw, sh],
            data: canvas.toDataURL('image/png') });
    })()`;
    let raw;
    try {
        raw = execFileSync('node', ['devtools/cdp-eval.mjs', expression], {
            cwd: ROOT, encoding: 'utf8', env: { ...process.env, CDP_TIMEOUT_MS: '90000' },
        }).trim();
    } catch (e) {
        console.log(`${out}: eval failed ${String(e.message).slice(0, 120)}`);
        continue;
    }
    let j;
    try { j = JSON.parse(raw); } catch { console.log(`${out}: ${raw.slice(0, 120)}`); continue; }
    fs.writeFileSync(path.join(ROOT, 'devtools', out),
        Buffer.from(j.data.replace(/^data:image\/png;base64,/, ''), 'base64'));
    console.log(`${out}: src=${j.src.join('x')} crop=${j.crop.join(',')}`
        + ` ${fs.statSync(path.join(ROOT, 'devtools', out)).size} B`);
}

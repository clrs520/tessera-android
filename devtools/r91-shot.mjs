// R91 visual evidence: pull one frame out of each exported file *through the app's own retriever*
// (no ffmpeg on this machine) and write it next to the probes, so the watermark's landing can be
// judged by eye and not only by the ink bbox. Reads no URL and prints no token.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FILES = [
    ['Tessera_2026-10-09_10-00-00_3.4-5.0s_1c_1104x720.mp4', 'r91-file-tl.jpg'],
    ['Tessera_2026-10-09_10-00-00_0.0-1.6s_1c_1104x720.mp4', 'r91-file-tr.jpg'],
    ['Tessera_2026-10-09_10-00-00_1.7-3.3s_4c_1488x960.mp4', 'r91-file-br4.jpg'],
];

for (const [name, out] of FILES) {
    const expression = `(async () => {
        const id = 'r91s' + Math.random().toString(36).slice(2, 7);
        const url = await new Promise((resolve) => {
            let done = false;
            const previous = window.__tdashcamNativeThumb;
            window.__tdashcamNativeThumb = (got, data) => {
                if (previous) previous(got, data);
                if (got === id && !done) { done = true; resolve(typeof data === 'string' ? data : null); }
            };
            setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
            window.TDashcamNative.requestThumb(id, '/storage/emulated/0/Download/${name}', 800, 1100);
        });
        return url || 'NO FRAME';
    })()`;
    let data;
    try {
        data = execFileSync('node', ['devtools/cdp-eval.mjs', expression], {
            cwd: ROOT, encoding: 'utf8', env: { ...process.env, CDP_TIMEOUT_MS: '60000' },
        }).trim();
    } catch (e) {
        console.log(`${out}: eval failed ${String(e.message).slice(0, 120)}`);
        continue;
    }
    if (!data.startsWith('data:')) { console.log(`${out}: ${data.slice(0, 120)}`); continue; }
    const b64 = data.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(path.join(ROOT, 'devtools', out), Buffer.from(b64, 'base64'));
    console.log(`${out}: ${fs.statSync(path.join(ROOT, 'devtools', out)).size} B from ${name}`);
}

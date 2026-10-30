// Tap the centre of a selector with real adb input (CDP clicks are not user activation).
//   node devtools/tap-to.mjs '#tabListBtn' [settling-ms]
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ADB = 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const DPR = 2.625;
const selector = process.argv[2];
const settle = Number(process.argv[3] || 400);
if (!selector) {
    console.error('usage: node devtools/tap-to.mjs <selector> [settle-ms]');
    process.exit(2);
}

const probe = path.join(here, '.tmp-centre.js');
writeFileSync(probe, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return JSON.stringify({ error: 'no such element' });
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2,
        size: [Math.round(r.width), Math.round(r.height)], display: s.display,
        text: (el.textContent || '').trim().slice(0, 20) });
})();`);

const centre = JSON.parse(execFileSync(process.execPath, [path.join(here, 'cdp-eval.mjs'), '--file', probe],
    { encoding: 'utf8' }));
unlinkSync(probe);
if (centre.error || !(centre.x > 0 && centre.y > 0)) {
    console.error('cannot tap: ' + JSON.stringify(centre));
    process.exit(1);
}

execFileSync(ADB, ['shell', 'input', 'tap',
    String(Math.round(centre.x * DPR)), String(Math.round(centre.y * DPR))]);
console.log(`tapped ${selector} at ${JSON.stringify(centre)}`);
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, settle);

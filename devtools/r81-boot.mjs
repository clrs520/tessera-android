// R81: does a cold start in system night mode paint a light frame before the dark one?
//   node devtools/r81-boot.mjs <label> [frames] [gapMs]
// force-stops the app, starts it, and pulls `adb screencap` as fast as the shell allows, then
// samples four fixed points of every frame. Capture and sampling are separated on purpose: a
// PowerShell call costs about a second and would stretch the window being measured.
// Pair the arms: run it once on the old build as the control, then on the new one.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ADB = 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const PS = 'powershell.exe';
const APP = 'com.tdashcam.studio';
const LABEL = process.argv[2] || 'arm';
const FRAMES = Number(process.argv[3] || 12);
const GAP = Number(process.argv[4] || 0);
const OUT = path.join('devtools', 'r81-frames');
fs.mkdirSync(OUT, { recursive: true });

function adb(args, opts = {}) {
    return execFileSync(ADB, args, { encoding: opts.text ? 'utf8' : 'buffer', maxBuffer: 64 << 20, ...opts });
}

adb(['shell', 'am', 'force-stop', APP], { text: true });
const t0 = Date.now();
adb(['shell', 'am', 'start', '-n', `${APP}/.MainActivity`], { text: true });
const shots = [];
for (let i = 0; i < FRAMES; i++) {
    const start = Date.now() - t0;
    const buf = adb(['exec-out', 'screencap', '-p']);
    const file = path.join(OUT, `${LABEL}-${String(i).padStart(2, '0')}.png`);
    fs.writeFileSync(file, buf);
    shots.push({ i, start, end: Date.now() - t0, file, buf });
    if (GAP) adb(['shell', 'sleep', String(Math.round(GAP / 1000) || 1)], { text: true });
}

// Size from the PNG header, then sample the same physical points in every frame.
function size(buf) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
const pts = [[0.05, 0.30], [0.30, 0.45], [0.62, 0.40], [0.50, 0.14]];
const rows = [];
for (const s of shots) {
    const { w, h } = size(s.buf);
    const spec = pts.map(([fx, fy], k) => `p${k}:${Math.round(fx * w)}:${Math.round(fy * h)}`).join(';');
    let out = '';
    try {
        out = execFileSync(PS, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
            'devtools/pixels.ps1', '-Path', s.file, '-Dpr', '1', '-Pts', spec],
            { encoding: 'utf8' });
    } catch (e) {
        out = 'PS-FAIL ' + e.message;
    }
    const colors = [...out.matchAll(/rgb\((\d+),(\d+),(\d+)\)/g)]
        .map(m => [Number(m[1]), Number(m[2]), Number(m[3])]);
    const lum = colors.map(c => Math.round(0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]));
    const mean = Math.round(lum.reduce((a, b) => a + b, 0) / (lum.length || 1));
    rows.push(`+${String(s.start).padStart(5)}→${String(s.end).padStart(5)}ms frame=${s.i} `
        + `size=${w}x${h} lum=[${lum.join(',')}] mean=${mean} `
        + `${mean < 80 ? 'DARK' : mean > 170 ? 'LIGHT/WHITE' : 'mixed'}`);
}
console.log(`== r81-boot ${LABEL} frames=${FRAMES} gap=${GAP}ms`);
console.log(rows.join('\n'));

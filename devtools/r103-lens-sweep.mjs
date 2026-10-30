// How strong should the rim be? `scale` and `stdDeviation` are two knobs nobody can tune by eye
// through a 72% fill, so sweep them against the hard-edged checkerboard (the one backdrop whose
// bending is measurable — CDP screenshots contain no video plane) and report, per pair, how much the
// rim moved and how much the *middle* moved. The right pair maximises the first and keeps the second
// at zero: a lens bends the edge, frosted glass smears everything.
//
//   node devtools/r102-lens-sweep.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { diffPng } from './png-diff.mjs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP = 'com.tdashcam.studio';
const PORT = 9333;
const PAIRS = [[-20, 11], [-30, 11], [-45, 11], [-30, 16], [-45, 16], [-60, 20], [-45, 24]];

const pid = (process.env.CDP_PID || execFileSync(ADB, ['shell', 'pidof', APP], { encoding: 'utf8' })).trim();
execFileSync(ADB, ['-s', 'emulator-5554', 'forward', `tcp:${PORT}`, `localabstract:webview_devtools_remote_${pid}`]);
const page = (await (await fetch(`http://127.0.0.1:${PORT}/json`, { signal: AbortSignal.timeout(8000) })).json())
    .find((p) => p.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('ws failed')), { once: true });
});
let seq = 0;
const send = (method, params = {}) => new Promise((res, rej) => {
    const id = ++seq;
    const on = (ev) => {
        const m = JSON.parse(ev.data);
        if (m.id !== id) return;
        ws.removeEventListener('message', on);
        if (m.error) return rej(new Error(JSON.stringify(m.error)));
        if (m.result?.exceptionDetails) return rej(new Error(m.result.exceptionDetails.exception?.description || 'threw'));
        res(m.result);
    };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id, method, params }));
    setTimeout(() => rej(new Error(`${method} timed out`)), 40000).unref?.();
});
const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;
const shot = async (name) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const path = `devtools/shots/r103-sweep-${name}.png`;
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
};

const setup = await evalJs(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.querySelectorAll('#r102plate,#r102bg,#r102defs,#r102style').forEach(n => n.remove());
    const bg = document.createElement('div');
    bg.id = 'r102bg';
    bg.style.cssText = 'position:fixed;z-index:99998;left:20px;top:200px;width:372px;height:360px;'
        + 'background:repeating-conic-gradient(#fff 0% 25%, #111 0% 50%) 0 0/24px 24px';
    const plate = document.createElement('div');
    plate.id = 'r102plate';
    plate.style.cssText = 'position:fixed;z-index:99999;border-radius:28px;background:rgba(26,29,40,0.30);'
        + 'left:56px;top:270px;width:300px;height:210px;pointer-events:none';
    document.body.append(bg, plate);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(400);
    const r = plate.getBoundingClientRect();
    return JSON.stringify({ dpr: devicePixelRatio, plate: [+r.left.toFixed(1), +r.top.toFixed(1), +r.right.toFixed(1), +r.bottom.toFixed(1)] });
})()`);
console.log('setup ', setup);
const { dpr, plate: p } = JSON.parse(setup);
const box = p.map((v, i) => Math.round(v * dpr));
const w = box[2] - box[0], h = box[3] - box[1];
const inner = [box[0] + Math.round(w * 0.25), box[1] + Math.round(h * 0.25), box[2] - Math.round(w * 0.25), box[3] - Math.round(h * 0.25)];
const rim = 20 * dpr;
const rings = [[box[0], box[1], box[2], box[1] + rim], [box[0], box[3] - rim, box[2], box[3]],
    [box[0], box[1], box[0] + rim, box[3]], [box[2] - rim, box[1], box[2], box[3]]];

const setFilter = (scale, std) => evalJs(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('r102defs')?.remove();
    const wrap = document.createElement('div');
    wrap.id = 'r102defs';
    wrap.innerHTML = '<svg width="0" height="0" style="position:absolute"><filter id="sweep" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">'
        + '<feGaussianBlur in="SourceAlpha" stdDeviation="${std}" result="e"/>'
        + '<feDisplacementMap in="SourceGraphic" in2="e" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/></filter></svg>';
    document.body.appendChild(wrap);
    const plate = document.getElementById('r102plate');
    plate.style.backdropFilter = 'url(#sweep) blur(16px) saturate(190%) brightness(1.04)';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(600);
    return (getComputedStyle(plate).backdropFilter || '').slice(0, 24);
})()`);
const setBlurOnly = () => evalJs(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('r102defs')?.remove();
    const plate = document.getElementById('r102plate');
    plate.style.backdropFilter = 'blur(16px) saturate(190%) brightness(1.04)';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(600);
    return 'baseline';
})()`);

const base = await (async () => { await setBlurOnly(); return shot('baseline'); })();
const rows = [];
for (const [scale, std] of PAIRS) {
    await setFilter(scale, std);
    const path = await shot(`s${-scale}-k${std}`);
    const di = diffPng(path, base, inner);
    const perRing = rings.map((bx) => diffPng(path, base, bx));
    const ring = perRing.reduce((acc, d) => { acc.mean += d.mean / 4; acc.pct += d.movedPct / 4; return acc; }, { mean: 0, pct: 0 });
    rows.push({ scale, std, rimMean: +ring.mean.toFixed(2), rimMoved: +ring.pct.toFixed(1), innerMean: +di.mean.toFixed(3), innerMoved: di.movedPct });
    console.log(`scale=${String(scale).padStart(4)} std=${String(std).padStart(2)}  边圈 mean=${String(+ring.mean.toFixed(2)).padStart(6)} moved=${String(+ring.pct.toFixed(1)).padStart(5)}%  内圈 mean=${String(di.mean).padStart(6)} moved=${di.movedPct}%  四角=[${perRing.map((d) => d.mean).join(',')}]`);
}
await evalJs(`(() => { document.getElementById('r102plate')?.remove(); document.getElementById('r102bg')?.remove(); document.getElementById('r102defs')?.remove(); return 1 })()`);
ws.close();
const best = rows.filter((r) => r.innerMean < 0.05).sort((a, b) => b.rimMean - a.rimMean)[0];
console.log('\n内圈几乎不动（<0.05）里边圈最强的一档：', JSON.stringify(best));

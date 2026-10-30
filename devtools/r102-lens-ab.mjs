// R102-1 evidence: does `backdrop-filter: url(#tesseraLens)` actually bend the picture, or is it a
// reference the parser keeps and the rasteriser ignores? Computed-value round trips proved nothing
// before (a byte-identical screenshot once told me the filter was inert), so this drives the real
// compositor: one paused frame, a glass plate pinned over the picture, one variant per screenshot,
// then a pixel diff over the plate and its surroundings.
//
//   node devtools/r102-lens-ab.mjs              # shipped filter vs blur-only vs none
//   node devtools/r102-lens-ab.mjs shape        # also try a shape-driven height field (feImage)
//
// The plate is synthetic on purpose. The real 底部条 sits below the picture in 单路, so a diff there
// measures nothing; the plate guarantees a hard-edged backdrop under the glass.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { diffPng } from './png-diff.mjs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP = 'com.tdashcam.studio';
const PORT = 9333;
const wantShape = process.argv.includes('shape');

const pid = (process.env.CDP_PID || execFileSync(ADB, ['shell', 'pidof', APP], { encoding: 'utf8' })).trim();
if (!pid) { console.error('app not running'); process.exit(1); }
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
const evalJs = async (expression) => (await send('Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true })).result.value;
const shot = async (name) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const path = `devtools/shots/r102-${name}.png`;
    writeFileSync(path, Buffer.from(data, 'base64'));
    return path;
};

const SETUP = `(async () => {
    const v = window.viewer, sleep = ms => new Promise(r => setTimeout(r, ms));
    // A crashed earlier run leaves its plate behind, and getElementById then returns the *stale* one
    // while the measured rect comes from the new one — every number is real but describes a
    // different box. Clear the lab before building it.
    document.querySelectorAll('#r102plate,#r102bg,#r102defs,#r102lab').forEach(n => n.remove());
    document.getElementById('r102style')?.remove();
    // CDP screenshots do not contain the video plane: the paused 单路 frame came back pure black, so
    // a plate over the picture measures nothing and every variant diffs to zero. Put the plate over
    // hard-edged DOM content instead — that is the layer the compositor definitely samples here, and
    // it answers the mechanism question (does url() refract at all in this WebView) cleanly.
    const style = document.createElement('style');
    style.id = 'r102style';
    style.textContent = '#r102plate::before{content:"";position:absolute;inset:0;border-radius:inherit;'
        + 'padding:16px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);'
        + '-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);'
        + 'mask-composite:exclude;pointer-events:none}';
    const bg = document.createElement('div');
    bg.id = 'r102bg';
    bg.style.cssText = 'position:fixed;z-index:99998;left:30px;top:220px;width:352px;height:320px;'
        + 'background:repeating-conic-gradient(#fff 0% 25%, #111 0% 50%) 0 0/24px 24px';
    const plate = document.createElement('div');
    plate.id = 'r102plate';
    plate.style.cssText = 'position:fixed;z-index:99999;border-radius:28px;background:rgba(26,29,40,0.30);'
        + 'left:60px;top:280px;width:292px;height:200px;pointer-events:none';
    document.head.appendChild(style);
    document.body.append(bg, plate);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(400);
    const r = plate.getBoundingClientRect();
    const b = bg.getBoundingClientRect();
    return JSON.stringify({ plates: document.querySelectorAll('#r102plate').length, event: !!v.currentEvent,
        css: Math.round(innerWidth) + 'x' + Math.round(innerHeight), dpr: devicePixelRatio,
        bg: [+b.left.toFixed(1), +b.top.toFixed(1), +b.right.toFixed(1), +b.bottom.toFixed(1)],
        plate: [+r.left.toFixed(1), +r.top.toFixed(1), +r.right.toFixed(1), +r.bottom.toFixed(1)] });
})()`;

const variant = (name, filter, defs, extra) => `(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    document.getElementById('r102defs')?.remove();
    if (${JSON.stringify(defs || '')} !== '') {
        const wrap = document.createElement('div');
        wrap.id = 'r102defs';
        wrap.innerHTML = ${JSON.stringify(defs)};
        document.body.appendChild(wrap);
    }
    const plate = document.getElementById('r102plate');
    if (!plate) return JSON.stringify({ error: 'plate gone' });
    plate.style.backdropFilter = ${JSON.stringify(filter)};
    plate.style.webkitBackdropFilter = ${JSON.stringify(filter)};
    const ring = ${JSON.stringify(extra || '')} || '';
    if (ring) {
        // The geometry (mask that keeps only the rim) is already in the stylesheet; this only adds
        // what the rim does.
        document.getElementById('r102style').textContent += '#r102plate::before{' + ring + '}';
    }
    // Two composited frames after the style lands, or the screenshot catches the previous surface.
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(600);
    const used = getComputedStyle(plate).backdropFilter || getComputedStyle(plate).webkitBackdropFilter;
    return JSON.stringify({ plate: used.replace(/url\\("[^"]*"\\)/g, 'url()').slice(0, 90),
        ring: getComputedStyle(plate, '::before').backdropFilter.replace(/url\\("[^"]*"\\)/g, 'url()').slice(0, 60) });
})()`;

const CLEAN = `(() => {
    document.getElementById('r102plate')?.remove();
    document.getElementById('r102defs')?.remove();
    return 'clean';
})()`;

const setupRaw = await evalJs(SETUP);
console.log('setup  ', setupRaw);
const st = JSON.parse(setupRaw);
if (st.error) { console.error(st.error); process.exit(1); }
const dpr = st.dpr;
const [l, t, r, b] = st.plate;
const plate = [Math.round(l * dpr), Math.round(t * dpr), Math.round(r * dpr), Math.round(b * dpr)];

const shapeDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="r102shape" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feImage href="data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='292' height='200'><rect width='292' height='200' fill='rgb(128,128,128)'/><rect x='4' y='4' width='284' height='192' rx='26' fill='none' stroke='rgb(255,255,255)' stroke-width='12'/></svg>`)}"
             x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="field"/>
    <feGaussianBlur in="field" stdDeviation="3" result="soft"/>
    <feDisplacementMap in="SourceGraphic" in2="soft" scale="-30" xChannelSelector="R" yChannelSelector="G"/>
  </filter></svg>`;

const edgeDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="tesseraEdge" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="0" result="a"/>
    <feDisplacementMap in="SourceGraphic" in2="a" scale="-13" xChannelSelector="R" yChannelSelector="G"/>
  </filter></svg>`;

const shipped = 'url(#tesseraLens) blur(16px) saturate(190%) brightness(1.04)';
const list = [
    ['none', 'none', '', ''],
    ['blur', 'blur(16px) saturate(190%) brightness(1.04)', '', ''],
    ['shipped', shipped, '', ''],
    ['lensOnly', 'url(#tesseraLens)', '', ''],
    ['ringBlur', 'blur(16px) saturate(190%) brightness(1.04)', '', 'backdrop-filter:blur(3px)'],
    ['ringEdge', 'blur(16px) saturate(190%) brightness(1.04)', edgeDefs,
        'backdrop-filter:url(#tesseraEdge) blur(2px)'],
];
if (wantShape) {
    list.push(['shape', 'url(#r102shape) blur(16px) saturate(190%) brightness(1.04)', shapeDefs, '']);
    list.push(['shapeOnly', 'url(#r102shape)', shapeDefs, '']);
}

const paths = {};
for (const [name, filter, defs] of list) {
    console.log('variant', name.padEnd(9), await evalJs(variant(name, filter, defs)));
    paths[name] = await shot(name);
    await new Promise((r) => setTimeout(r, 200));
}
await evalJs(CLEAN);
ws.close();

// A uniform shift and a real lens both move pixels; only a lens leaves them at the rim. So the same
// pair is measured twice: the inner 55% of the plate, and the 18 CSS px ring around it.
const iw = plate[2] - plate[0], ih = plate[3] - plate[1];
const rim = 18 * dpr;
const inner = [plate[0] + Math.round(iw * 0.225), plate[1] + Math.round(ih * 0.225),
    plate[2] - Math.round(iw * 0.225), plate[3] - Math.round(ih * 0.225)];
const ringBoxes = [[plate[0], plate[1], plate[2], plate[1] + rim],
    [plate[0], plate[3] - rim, plate[2], plate[3]],
    [plate[0], plate[1], plate[0] + rim, plate[3]],
    [plate[2] - rim, plate[1], plate[2], plate[3]]];
const dpr2 = (a, b, boxes) => boxes.reduce((acc, bx) => {
    const d = diffPng(paths[a], paths[b], bx);
    acc.mean += d.mean / boxes.length; acc.max = Math.max(acc.max, d.max); acc.moved += d.movedPx; acc.px += (bx[2] - bx[0]) * (bx[3] - bx[1]);
    return acc;
}, { mean: 0, max: 0, moved: 0, px: 0 });

console.log('\nplate(设备px) =', plate.join(','), ' inner =', inner.join(','));
const row = (a, b) => {
    const di = diffPng(paths[a], paths[b], inner);
    const dr = dpr2(a, b, ringBoxes);
    return `${a.padEnd(9)} vs ${b.padEnd(9)} 内圈 mean=${String(di.mean).padStart(6)} max=${String(di.max).padStart(3)} moved=${String(di.movedPct).padStart(6)}%  |  边缘圈 mean=${String(+dr.mean.toFixed(3)).padStart(6)} max=${String(dr.max).padStart(3)} moved=${String((100 * dr.moved / dr.px).toFixed(2)).padStart(6)}%`;
};
const out = [];
for (const name of Object.keys(paths)) if (name !== 'none') out.push(row(name, 'none'));
for (const name of Object.keys(paths)) if (name !== 'none' && name !== 'blur') out.push(row(name, 'blur'));
console.log(out.join('\n'));
console.log('\n判读：shipped/lensOnly vs blur 内圈≈0 ⇒ url(#tesseraLens) 没有折射上屏（只是把后景平移，肉眼无感）。');
console.log('      shape vs blur 边缘圈明显大于内圈 ⇒ feImage 形状高度场成立，玻璃边缘真的在弯折后景。');


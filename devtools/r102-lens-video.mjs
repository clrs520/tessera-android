// R102's last open question, answered with the plane that actually matters. CDP screenshots never
// contain the video (it is composited by the system, which is why every paused frame came back black
// and why the checkerboard had to stand in), so all the refraction evidence so far was DOM-only.
// `adb screencap` *does* contain it — so pause a real frame, park a glass surface over it, shoot with
// the material on and off, and diff the rim against the middle.
//
//   node devtools/r102-lens-video.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { diffPng } from './png-diff.mjs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const APP = 'com.tdashcam.studio';
const DEV = ['-s', 'emulator-5554'];
const sh = (cmd) => execFileSync(ADB, [...DEV, 'shell', cmd], { encoding: 'utf8' }).trim();
const evalJs = (expr) => execFileSync('node', ['devtools/cdp-eval.mjs', expr],
    { encoding: 'utf8', env: { ...process.env, CDP_PID: process.env.CDP_PID || '' } }).trim();
const cap = (name) => {
    const buf = execFileSync(ADB, [...DEV, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 1 << 28 });
    const path = `devtools/shots/r102-vid-${name}.png`;
    writeFileSync(path, buf);
    return path;
};

const setup = evalJs(`(async () => {
    const v = window.viewer, sleep = ms => new Promise(r => setTimeout(r, ms));
    document.querySelectorAll('#r102plate,#r102bg,#r102defs,#r102style').forEach(n => n.remove());
    document.querySelector('.header-right')?.classList.remove('active');
    if (document.querySelector('.player-area.empty') || !v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || ''))) || (v.eventGroups || [])[0];
        await v.playEvent(e.eventId); await sleep(3500);
    }
    document.querySelector('.view-btn[data-view="grid"]')?.click();
    await sleep(1800);
    if (v.multiCameraPlayer.isPlaying) v.videoControls.togglePlayPause();
    await sleep(900);
    // A glass plate the size of the ⋮ panel, parked where the panel floats: over the feeds.
    const plate = document.createElement('div');
    plate.id = 'r102plate';
    plate.style.cssText = 'position:fixed;z-index:99999;border-radius:22px;left:60px;top:300px;'
        + 'width:300px;height:220px;pointer-events:none';
    document.body.appendChild(plate);
    const r = plate.getBoundingClientRect();
    return JSON.stringify({ playing: !!v.multiCameraPlayer.isPlaying, layout: v.multiCameraPlayer.layoutMode,
        dpr: devicePixelRatio, css: Math.round(innerWidth) + 'x' + Math.round(innerHeight),
        plate: [+r.left.toFixed(1), +r.top.toFixed(1), +r.right.toFixed(1), +r.bottom.toFixed(1)] });
})()`);
console.log('setup  ', setup);
const st = JSON.parse(setup);
const dpr = st.dpr;
const [l, t, r, b] = st.plate;
const plate = [Math.round(l * dpr), Math.round(t * dpr), Math.round(r * dpr), Math.round(b * dpr)];
const iw = plate[2] - plate[0], ih = plate[3] - plate[1];
const inner = [plate[0] + Math.round(iw * 0.25), plate[1] + Math.round(ih * 0.25),
    plate[2] - Math.round(iw * 0.25), plate[3] - Math.round(ih * 0.25)];
const rim = 20 * dpr;
const rings = [[plate[0], plate[1], plate[2], plate[1] + rim], [plate[0], plate[3] - rim, plate[2], plate[3]],
    [plate[0], plate[1], plate[0] + rim, plate[3]], [plate[2] - rim, plate[1], plate[2], plate[3]]];

const CSS = {
    plain: 'background:rgba(26,29,40,0.72)',
    blur: 'background:rgba(26,29,40,0.72);backdrop-filter:blur(16px) saturate(190%) brightness(1.04)',
    lens: 'background:rgba(26,29,40,0.72);backdrop-filter:url(#tesseraLens) blur(16px) saturate(190%) brightness(1.04)',
};
const apply = (mode) => evalJs(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const plate = document.getElementById('r102plate');
    if (!plate) return 'plate gone';
    document.getElementById('r102style')?.remove();
    const s = document.createElement('style');
    s.id = 'r102style';
    s.textContent = 'html.glass-lens:not(.solid-material) #r102plate{' + ${JSON.stringify(CSS.plain)} + '}';
    document.head.appendChild(s);
    const set = (css) => { s.textContent = 'html.glass-lens:not(.solid-material) #r102plate{' + css + '}'; };
    set(${JSON.stringify(CSS[mode])});
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await sleep(700);
    return getComputedStyle(plate).backdropFilter.replace(/url\\("[^"]*"\\)/g, 'url()');
})()`);

const shots = {};
for (const mode of ['plain', 'blur', 'lens']) {
    console.log('mode   ', mode, await apply(mode));
    shots[mode] = cap(mode);
    await new Promise((r) => setTimeout(r, 250));
}
evalJs(`(() => { document.getElementById('r102plate')?.remove(); document.getElementById('r102style')?.remove(); return 1 })()`);

const d = (a, b, box) => diffPng(shots[a], shots[b], box);
const line = (a, b) => {
    const di = d(a, b, inner), dr = d(a, b, rings[0]);
    const all = rings.reduce((acc, bx) => { const x = d(a, b, bx); acc.mean += x.mean / 4; acc.moved += x.movedPx; return acc; }, { mean: 0, moved: 0 });
    return `${a.padEnd(5)} vs ${b.padEnd(5)} 内圈 mean=${String(di.mean).padStart(7)} moved=${String(di.movedPct).padStart(6)}% | 四周边圈 mean=${String(+all.mean.toFixed(3)).padStart(7)} movedPx=${all.moved}`;
};
console.log('\nplate(设备px)=', plate.join(','), ' 画面=六宫格暂停帧');
console.log([line('blur', 'plain'), line('lens', 'plain'), line('lens', 'blur')].join('\n'));
console.log('\n判读：lens vs blur 的边圈明显大于内圈 ⇒ 折射在真视频上也上屏，而且是贴边的。');
console.log('      两者全等 ⇒ 这台 WebView 的后景滤镜读不到视频平面，玻璃在画面上只会糊不会弯。');

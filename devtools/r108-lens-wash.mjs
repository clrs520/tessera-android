// R108 排查①的第二半：跳的那一下到底是「底色变厚」还是「透镜挂上」。
// 上一份时间线（r108-panel-open-timeline.js）量到 1.2.184 上底色全程 0.863 不动，
// 而 `.lens-on` 在面板可见之后 ~100ms 才挂上。所以这里只留一个变量：
// 同一个几何、同一个 alpha、同一帧视频，只把 backdrop-filter 从
//   url(#tesseraLens) blur(16px) saturate(190%) brightness(1.04)
// 换成
//   blur(22px) saturate(180%)
// （用一条注入规则盖住 `.lens-on` 那一档，不动 class、不动几何），
// 然后各拍一张 screencap（CDP 截图没有视频平面，必须走 adb），量面板**内部**的平均亮度/饱和。
// 如果挂上透镜之后面板内部明显更亮更灰 —— 用户看到的「一下子变白底」就是它，跟 alpha 无关。
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { decodePng } from './png-diff.mjs';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const DEV = ['-s', 'emulator-5554'];
const PID = process.env.CDP_PID;
const ev = (expr) => execFileSync('node', ['devtools/cdp-eval.mjs', expr],
    { encoding: 'utf8', env: { ...process.env, CDP_PID: PID } }).trim();
const cap = (name) => {
    const buf = execFileSync(ADB, [...DEV, 'exec-out', 'screencap', '-p'],
        { encoding: 'buffer', maxBuffer: 1 << 28 });
    const p = `devtools/shots/r108-${name}.png`;
    writeFileSync(p, buf);
    return p;
};
const sleep = (ms) => execFileSync('node', ['-e', `setTimeout(()=>{},${ms})`]);

// 面板内部区域（CSS px）+ 设备像素比 → 截图上的取样框。避开四边 24 CSS px：圆角、边框、
// 分隔线都不该进「这块玻璃有多白」的统计。
const region = JSON.parse(ev(`(async () => {
    const v = window.viewer, s = ms => new Promise(r => setTimeout(r, ms));
    document.querySelectorAll('#r108wash').forEach(n => n.remove());
    if (document.querySelector('.player-area.empty') || !v.currentEvent) {
        const e = (v.eventGroups || []).find(x => !/RecentClips/i.test(String(x.eventId || ''))) || (v.eventGroups || [])[0];
        await v.playEvent(e.eventId); await s(3200);
    }
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    localStorage.setItem('tdashcam.themeMode', 'light'); v.applyTheme(false);
    await s(900);
    const hdr = () => document.querySelector('.header-right');
    if (!hdr()?.classList.contains('active')) { document.getElementById('tabMoreBtn').click(); }
    for (let i = 0; i < 24 && glassState.lensLive < 1; i++) await s(150);
    await s(700);
    const r = document.querySelector('.header-collapsed .header-actions-group').getBoundingClientRect();
    return JSON.stringify({ left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        dpr: devicePixelRatio, alpha: glassState.alpha, bg: getComputedStyle(document.querySelector('.header-collapsed .header-actions-group')).backgroundColor,
        bd: glassState.src + '/' + glassState.luma, css: innerWidth + 'x' + innerHeight });
})()`));

const maskRule = (mode) => `(function(){
    document.querySelectorAll('#r108wash').forEach(n => n.remove());
    if ('${mode}' !== 'lens') {
        const st = document.createElement('style'); st.id = 'r108wash';
        st.textContent = '.header-collapsed .header-actions-group.lens-on, .metadata-panel.lens-on, .phone-action-bar.lens-on, .card-context-menu.lens-on {'
            + ' -webkit-backdrop-filter: ' + ('${mode}' === 'none' ? 'none' : 'blur(22px) saturate(180%)') + ';'
            + ' backdrop-filter: ' + ('${mode}' === 'none' ? 'none' : 'blur(22px) saturate(180%)') + ' !important; }';
        document.head.appendChild(st);
    }
    return document.querySelectorAll('#r108wash').length ? 'masked' : 'lens';
})()`;

const stats = (path) => {
    const { width, height, rgba } = decodePng(path);
    const pad = 24 * region.dpr;
    // 四条边界都要落成整数：Buffer 的小数下标返回 undefined，于是整份统计变成 NaN 还不报错。
    const x0 = Math.max(0, Math.round(region.left * region.dpr + pad));
    const x1 = Math.min(width - 1, Math.round(region.right * region.dpr - pad));
    const y0 = Math.max(0, Math.round(region.top * region.dpr + pad));
    const y1 = Math.min(height - 1, Math.round(region.bottom * region.dpr - pad));
    let n = 0, r = 0, g = 0, b = 0, luma = 0, nearWhite = 0;
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            const o = (y * width + x) * 4;
            if (rgba[o] === undefined) throw new Error(`取样框越界：${path} ${width}x${height} offset ${o}`);
            r += rgba[o]; g += rgba[o + 1]; b += rgba[o + 2];
            const L = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
            luma += L;
            // 「白底」的读感来自大片接近纯白的像素，统计 >246 的占比
            if (L > 246) nearWhite++;
            n++;
        }
    }
    return { box: `${x0},${y0}..${x1},${y1}`, px: n,
        mean: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
        luma: +(luma / n).toFixed(1), nearWhitePct: +(100 * nearWhite / n).toFixed(1) };
};

const out = { region, shots: {} };
for (const mode of ['lens', 'blur', 'none']) {
    ev(maskRule(mode));
    sleep(900);                       // 让那一档滤镜真的合成出来
    out.shots[mode] = stats(cap(`wash-${mode}`));
    out.shots[mode].filter = ev(`(function(){const c=getComputedStyle(document.querySelector('.header-collapsed .header-actions-group'));return (c.backdropFilter||c.webkitBackdropFilter||'none').slice(0,34);})()`);
}
ev('(function(){document.querySelectorAll("#r108wash").forEach(n=>n.remove());return "cleared";})()');
const d = (a, b) => +(out.shots[a].luma - out.shots[b].luma).toFixed(1);
out.delta = { 'lens-blur': d('lens', 'blur'), 'lens-none': d('lens', 'none'), 'blur-none': d('blur', 'none') };
out.nearWhite = Object.fromEntries(Object.entries(out.shots).map(([k, s]) => [k, s.nearWhitePct]));
console.log(JSON.stringify(out, null, 1));

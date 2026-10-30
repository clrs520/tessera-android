// R112 取证：用户报「播放时打开设置，界面还是会变一下，没有统一，显得割裂」。
// 1.2.191 的 who-repins 已经证明**开合那一下 alpha 不动**（.90 → .90，mounts 不涨），所以「变」的不是透度。
// 这一份不猜成因，只把「开之前 / 开之后」每一面的**外观三件套**并排抓下来：
//   底色 alpha（画出来的厚度）、backdrop-filter（有没有挂上 url() 那圈折射）、.lens-on（R105 的几何开关）。
// 割裂 = 同一屏上有的面是玻璃、有的面不是，或者开一个面板让别的面**掉了材质**。这两种在 alpha 上都是隐形的。
(() => {
    const sel = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        长按菜单: '.card-context-menu',
        行车数据卡片: '.metadata-panel',
        导出角标: '#exportPill',
        空状态卡: '.player-area.empty .empty-hero',
        设置面板本体: '.header-right .menu-panel, #headerMenu, .header-actions-group',
    };
    const aOf = (n) => {
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor);
        if (!m) return null;
        const p = m[1].split(',').map(parseFloat);
        return p.length >= 4 ? +p[3].toFixed(3) : 1;
    };
    const bfOf = (n) => {
        const c = getComputedStyle(n);
        const v = c.backdropFilter || c.webkitBackdropFilter || 'none';
        return /url\(/.test(v) ? 'LENS' : (v === 'none' ? 'none' : 'blur-only');
    };
    const rows = [];
    for (const [name, s] of Object.entries(sel)) {
        const n = document.querySelector(s);
        if (!n) { rows.push(`${name}: 无节点`); continue; }
        const c = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        rows.push(`${name}: alpha=${aOf(n)} 材质=${bfOf(n)} lens-on=${n.classList.contains('lens-on') ? 1 : 0}`
            + ` 可见=${c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0 ? 1 : 0}`
            + ` 盒=${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}`
            + ` 类=${n.className.toString().slice(0, 40)}`);
    }
    const bar = document.querySelector('.phone-action-bar');
    const pic = document.querySelector('.video-container.visible video');
    return JSON.stringify({
        tag: window.__r112Tag || '?',
        t: Date.now() % 100000,
        glass: `alpha=${glassState.alpha.toFixed(3)} plate=${glassState.plateAlpha.toFixed(3)} want=${glassState.target.toFixed(3)}`
            + ` src=${glassState.src}/${glassState.luma} lensLive=${glassState.lensLive} rel=${glassState.releasingGlass ? 1 : 0}`
            + ` pk=${glassState.peakGlass.toFixed(3)}`,
        vars: `--lens-alpha=${getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha').trim()}`
            + ` --lens-alpha-plate=${getComputedStyle(document.documentElement).getPropertyValue('--lens-alpha-plate').trim()}`,
        playing: !!(window.viewer && window.viewer.isPlaying),
        live: [...document.querySelectorAll('video')].filter((v) => v.videoWidth > 0).length,
        headerActive: (document.querySelector('.header-right') || { className: '-' }).className.includes('active') ? 1 : 0,
        barAlpha: bar ? aOf(bar) : null,
        picVisible: pic ? `${pic.videoWidth}x${pic.videoHeight}` : 'none',
        rows,
    }, null, 1);
})()

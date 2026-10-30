// R119 装机前预检：这台 WebView 到底吃不吃「z-index 用 0s + 延迟 = 在延迟结束时才跳变」这一招。
// 注入的 <style> 在 head 末尾，层叠上永远赢 ⇒ 这里只验机制，不验胜负（胜负看装完以后的判据）。
(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const header = document.querySelector('.main-header');
    const panel = document.querySelector('.header-right .header-actions-group');
    const hr = document.getElementById('headerRight');
    const hud = document.getElementById('metadataPanel');
    const CSS = `:root{--menu-fade:0.2s}
.main-header{transition:z-index 0s linear var(--menu-fade)}
.main-header:has(.header-right.active){z-index:1700;transition:z-index 0s linear 0s}
body.more-panel-open .main-header{z-index:1700;transition:z-index 0s linear 0s}`;
    document.getElementById('r119-pre-style')?.remove();
    const sty = document.createElement('style');
    sty.id = 'r119-pre-style';
    sty.textContent = CSS;
    document.head.appendChild(sty);
    await sleep(150);

    const topAtHud = () => { const r = hud.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return hit ? `${hit.tagName}.${(hit.className || '').toString().split(' ').slice(0, 2).join('.')}` : 'null'; };
    const read = () => ({ z: getComputedStyle(header).zIndex, op: getComputedStyle(panel).opacity,
        vis: getComputedStyle(panel).visibility, top: topAtHud() });

    hr.classList.add('active');
    await sleep(400);
    const open = read();
    const t0 = performance.now();
    hr.classList.remove('active');
    const marks = [];
    for (const at of [0, 60, 120, 180, 240, 320, 480]) {
        while (performance.now() - t0 < at) await sleep(10);
        marks.push(Object.assign({ dt: Math.round(performance.now() - t0) }, read()));
    }
    sty.remove();
    return JSON.stringify({
        // 这台 WebView 上没有 `CSS.supports`（真的不是函数），所以不能拿它当能力判据 ——
        // 机制成不成立直接看下面 marks 的实测值。
        hasSupports: typeof CSS?.supports === 'function',
        open, marks,
        // 期望：淡出还没走完（op>0.05 或 vis=visible）的那些采样点上 header 仍是 1700，
        // 走完以后才回 50；HUD 命中面板自己而不是 meta-speed-value。
        heldWhileVisible: marks.filter(m => m.vis !== 'hidden' && parseFloat(m.op) > 0.05)
            .every(m => m.z === '1700'),
    });
})()

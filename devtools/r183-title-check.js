// R183 · 长按菜单标题行的验收：不是「JS 里读到一个数」，而是把菜单真开起来，
// 量计算样式 + 让截图能看见它（改样式的账要按 appearance 结，R42 的教训）。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const ev = (v.eventGroups || []).find((e) => e.eventType !== 'RecentClips') || v.eventGroups[0];
    v.showCardContextMenu(ev);
    await s(500);
    const t = document.getElementById('cardContextTitle');
    const cs = getComputedStyle(t);
    const r = t.getBoundingClientRect();
    const items = [...document.querySelectorAll('.card-context-menu .context-item')]
        .filter((n) => !n.hidden).map((n) => Math.round(parseFloat(getComputedStyle(n).fontSize) * 100) / 100);
    const rng = document.createRange(); rng.selectNodeContents(t);
    const textW = rng.getBoundingClientRect().width;
    // 合成底色：菜单是白玻璃，取它自己的 fill 与背后页面底做个近似合成后算对比度太绕，
    // 这里直接量「渲出来的像素」——从截图同一帧的 canvas 读不到，所以只报计算色与 alpha 档。
    return JSON.stringify({
        text: t.textContent,
        fs: cs.fontSize, color: cs.color, lh: cs.lineHeight,
        box: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
        clip: textW > r.width, textW: Math.round(textW), availW: Math.round(r.width),
        itemSizes: [...new Set(items)],
        menuShown: document.querySelector('.card-context-menu').classList.contains('show'),
    });
})()

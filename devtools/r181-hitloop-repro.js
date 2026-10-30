// R181 · 复刻 r102-verify-landscape 那条「N 行仍可点」的滚动写法，看 dead 到底怎么来的。
// 每行同时记 scrollTop 与命中，一次往返里读完，不留插值空间。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const raf = () => new Promise((r) => requestAnimationFrame(r));
    const panel = document.querySelector('.header-actions-group');
    if (!panel) return JSON.stringify({ err: 'no panel' });
    const run = async (mode) => {
        const wait = mode === 'raf' ? raf : async () => sleep(0);
        const prevTop = panel.scrollTop;
        panel.scrollTop = panel.scrollHeight;
        await wait();
        const live = [...panel.querySelectorAll('button, a')]
            .filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
        const dead = [];
        const tops = [];
        for (const n of live) {
            const pr = panel.getBoundingClientRect();
            const r0 = n.getBoundingClientRect();
            panel.scrollTop += (r0.top - pr.top) - 8;
            await wait();
            tops.push(Math.round(panel.scrollTop));
            const b = n.getBoundingClientRect();
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            if (!(hit === n || n.contains(hit))) {
                dead.push((n.id || String(n.className || n.tagName).slice(0, 18))
                    + '@' + Math.round(b.top) + '→' + (hit ? (hit.id || String(hit.className || hit.tagName).slice(0, 16)) : 'null'));
            }
        }
        panel.scrollTop = prevTop;
        return { mode, live: live.length, dead: dead.length, list: dead.slice(0, 6), tops: tops.slice(0, 10) };
    };
    const a = await run('timeout0');
    const b = await run('raf');
    return JSON.stringify({
        scrollH: panel.scrollHeight, clientH: panel.clientHeight,
        overflow: panel.scrollHeight - panel.clientHeight,
        csOverflowY: getComputedStyle(panel).overflowY,
        scrollerIsPanel: panel.scrollHeight > panel.clientHeight,
        a, b,
    });
})()

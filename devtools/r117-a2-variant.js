// A2 的注入实验 v2。v1 有两处量具错，先记下来：
//  ① 「可放」不能拿标签自己的盒宽算（flex 里它拿够就够，ink 永远 == 盒宽，每条都"过"也每条都"不差"）；
//     要比的是**标签右沿有没有越过行的内容盒右沿**，以及行本身 scrollWidth 有没有超。
//  ② 长按菜单的行不是 `.btn-text`，是 `.context-item > span`（没有那个类名）—— v1 数到 0 行。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const px = (v) => Math.round(parseFloat(v) * 100) / 100;
    const panel = document.querySelector('.header-collapsed .header-actions-group');
    const menu = document.querySelector('.card-context-menu');
    const hr = document.querySelector('.header-right');
    const ink = (n) => { const r = document.createRange(); r.selectNodeContents(n); return Math.round(r.getBoundingClientRect().width * 10) / 10; };

    hr.classList.add('active');
    menu.classList.add('show');
    document.body.classList.add('context-open');
    await sleep(500);

    const labelOf = (row) => row.classList && row.classList.contains('context-item')
        ? [...row.children].find((c) => !c.classList.contains('context-icon') && (c.textContent || '').trim())
        : row.querySelector('.btn-text');

    const measure = (root, name) => {
        const rows = [...root.querySelectorAll('button, a')].filter((b) =>
            getComputedStyle(b).display !== 'none' && labelOf(b));
        const clipped = [];
        let widest = 0, widestT = '-';
        rows.forEach((b) => {
            const t = labelOf(b);
            const cs = getComputedStyle(b);
            const rowRight = b.getBoundingClientRect().right - parseFloat(cs.paddingRight);
            const need = ink(t);
            const got = Math.round(t.getBoundingClientRect().width * 10) / 10;
            if (need > got + 0.5 || t.getBoundingClientRect().right > rowRight + 0.5
                || b.scrollWidth > b.clientWidth + 1) {
                clipped.push(`${(t.textContent || '').trim().slice(0, 9)} 墨${need}>盒${got} 行${b.scrollWidth}/${b.clientWidth}`);
            }
            if (need > widest) { widest = need; widestT = (t.textContent || '').trim().slice(0, 9); }
        });
        const first = rows[0];
        return {
            name, rows: rows.length,
            font: first ? px(getComputedStyle(labelOf(first)).fontSize) : '-',
            rowH: first ? px(first.getBoundingClientRect().height) : '-',
            widest: `${widestT} ${widest}`,
            clipped: clipped.length, clippedSample: clipped.slice(0, 4),
            scroll: root.scrollHeight > root.clientHeight + 1 ? `超 ${root.scrollHeight - root.clientHeight}px` : '不滚',
        };
    };

    const style = document.createElement('style');
    style.id = 'r117-variant';
    document.head.appendChild(style);
    const P = 'html.touch-ui .header-collapsed .header-actions-group .btn-text';
    const M = 'html.touch-ui .card-context-menu .context-item > span';
    const run = async (css) => {
        style.textContent = css;
        await sleep(150);
        return { panel: measure(panel, '⋮ 面板'), menu: measure(menu, '长按菜单') };
    };
    const results = [];
    results.push(['① 现状（12.48 / 14.72）', await run('')]);
    results.push(['② 面板升到 14.72', await run(`${P}{font-size:.92rem !important}`)]);
    results.push(['③ 菜单降到 12.48', await run(`${M}{font-size:.78rem !important}`)]);
    results.push(['④ 两边并到 .83rem', await run(`${P},${M}{font-size:.83rem !important}`)]);
    results.push(['⑤ 两边并到 .88rem(=--fs-body)', await run(`${P},${M}{font-size:.88rem !important}`)]);

    style.remove();
    hr.classList.remove('active');
    menu.classList.remove('show');
    document.body.classList.remove('context-open');
    return JSON.stringify(results.map(([v, r]) => ({ variant: v, ...r })), null, 1);
})();

// R122 · ⋮ 面板的栅格实况：分组标题 + 每一行在网格里占哪几列、谁是满宽。
// 竖屏与横屏各跑一次，用来对齐「分类不一致」与「复制诊断后面空一格」这两条。
(() => {
    const host = document.getElementById('headerActionsGroup');
    const cs = getComputedStyle(host);
    const kids = [...host.children].filter((n) => !n.classList.contains('phone-only-btn') || getComputedStyle(n).display !== 'none');
    const info = (n) => {
        const s = getComputedStyle(n);
        const r = n.getBoundingClientRect();
        return {
            tag: n.tagName.toLowerCase(),
            cls: String(n.className || '').trim(),
            text: (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 14),
            display: s.display,
            col: s.gridColumnStart + '/' + s.gridColumnEnd,
            row: s.gridRowStart,
            span: Math.round(r.width),
            x: Math.round(r.left), y: Math.round(r.top),
        };
    };
    return {
        orient: innerWidth > innerHeight ? 'landscape' : 'portrait',
        grids: { cols: cs.gridTemplateColumns, rows: cs.gridTemplateRows, gap: cs.gap, autoFlow: cs.gridAutoFlow },
        hostBox: (() => { const r = host.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
        dividers: [...host.querySelectorAll('.menu-divider')].map((n) => (n.textContent || '').trim()),
        rows: kids.map(info),
    };
})()

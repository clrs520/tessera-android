// A3/A6/A2 的改前基线。只量不改，并且把「并档会不会挤掉栅格」这一条用注入变体实测出来，
// 不靠推断（R99/R115 的手法：注入 <style> → 读计算值/实宽 → 摘掉）。
(() => {
    const px = (v) => Math.round(parseFloat(v) * 100) / 100;
    const face = (sel) => document.querySelector(sel);
    const out = {};

    // ---- A3 · 两块浮在同一条底条上的面，各离它多少 -------------------------------
    const bar = face('#phoneActionBar');
    const panel = face('.header-collapsed .header-actions-group');
    const menu = face('.card-context-menu');
    const actH = px(getComputedStyle(document.documentElement).getPropertyValue('--action-h'));
    out.A3 = {
        actionH: actH,
        barLayoutTop: bar ? bar.offsetTop : '-',
        panel: panel ? { cssBottom: getComputedStyle(panel).bottom, layoutBottom: panel.offsetTop + panel.offsetHeight,
            gap: bar ? bar.offsetTop - (panel.offsetTop + panel.offsetHeight) : '-' } : 'ABSENT',
        menu: menu ? { cssBottom: getComputedStyle(menu).bottom, display: getComputedStyle(menu).display,
            layoutBottom: menu.offsetTop + menu.offsetHeight } : 'ABSENT',
    };

    // ---- A6 · 「有录像」chip 的描边到底画了几遍 ----------------------------------
    const chips = [...document.querySelectorAll('.dir-volume-chip')];
    out.A6 = {
        dirOpen: !!face('.dir-modal-content') && getComputedStyle(face('.dir-modal-content')).display !== 'none',
        chips: chips.length,
        rows: chips.slice(0, 4).map((c) => {
            const s = getComputedStyle(c);
            return {
                cls: c.className, hasClips: c.classList.contains('has-clips'),
                border: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].join('/'),
                borderColor: s.borderTopColor,
                shadow: s.boxShadow === 'none' ? 'none' : s.boxShadow.slice(0, 70),
                radius: s.borderTopLeftRadius,
            };
        }),
    };

    // ---- A2 · 两处「菜单行」的字号，以及并档会不会挤 ------------------------------
    const btnText = (el) => { const n = el && (el.querySelector('.btn-text') || el.querySelector('.tab-label')); return n; };
    const panelRow = panel ? panel.querySelector('button .btn-text') : null;
    const menuRow = menu ? menu.querySelector('button, .menu-row') : null;
    const menuText = menuRow ? (menuRow.querySelector('.btn-text') || menuRow) : null;
    // Range 实宽：scrollWidth 量不到父层裁字（R99）。
    const inkWidth = (n) => {
        if (!n) return null;
        const r = document.createRange();
        r.selectNodeContents(n);
        const box = r.getBoundingClientRect();
        return { ink: Math.round(box.width * 10) / 10, text: (n.textContent || '').trim().slice(0, 10) };
    };
    out.A2 = {
        panelRowFont: panelRow ? px(getComputedStyle(panelRow.closest('button')).fontSize) : '-',
        panelRowInk: panelRow ? inkWidth(panelRow) : null,
        panelRowRoom: panelRow ? px(panelRow.getBoundingClientRect().width) : '-',
        menuRowFont: menuText ? px(getComputedStyle(menuText.closest('button') || menuText).fontSize) : '-',
        menuRowInk: menuText ? inkWidth(menuText) : null,
        menuRows: menu ? menu.querySelectorAll('button, .menu-row').length : 0,
        menuDisplay: menu ? getComputedStyle(menu).display : 'ABSENT',
    };
    return JSON.stringify(out, null, 1);
})();

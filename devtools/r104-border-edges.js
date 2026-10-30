// R104 · Phase 1 evidence: what colour is each of the four edges of every lens surface?
// The complaint is "四条边颜色不统一" + "HUD 卡片边框不完整", so read the computed border per side
// plus the inset shadows, in both themes, and print the composite the eye actually sees.
(function () {
    const SURF = {
        底部条: '.phone-action-bar',
        '⋮ 面板': '.header-collapsed .header-actions-group',
        行车数据卡片: '.metadata-panel',
        找片hero: '.player-area.empty .empty-hero',
        长按菜单: '.card-context-menu',
    };
    const px = (s) => (s.match(/[\d.]+/g) || []).map(Number);
    const row = (name, el) => {
        const s = getComputedStyle(el);
        const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => ({
            w: parseFloat(s['border' + k + 'Width']) || 0,
            c: s['border' + k + 'Color'],
        }));
        const shadow = s.boxShadow || 'none';
        const insets = (shadow.match(/inset[^,]+,[^,]+,[^,]+,[^,]+,[^)]+\)|inset[^)]+/g) || []);
        const distinct = new Set(sides.map((x) => x.c)).size;
        return { name, sides: sides.map((x) => `${x.w}px ${x.c}`).join(' | '), distinctColors: distinct,
            insets, radius: s.borderTopLeftRadius, bg: s.backgroundColor };
    };
    const out = { theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light', rows: [] };
    for (const [name, sel] of Object.entries(SURF)) {
        const el = document.querySelector(sel);
        if (!el) { out.rows.push({ name, missing: true }); continue; }
        out.rows.push(row(name, el));
    }
    return JSON.stringify(out, null, 1);
})()

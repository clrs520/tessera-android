// R182 · 截图前的现场安置：竖屏/横屏 × 中/英，筛到「最近」并把说明滚进可视区。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const lang = window.__r182lang || 'zh';
    if (v.currentLanguage !== lang) { v.setLanguage(lang); await s(600); }
    const d = document.querySelector('.sidebar');
    if (d && d.getBoundingClientRect().left < -1) { v.toggleSidebar(true); await s(700); }
    const seg = document.querySelector('#eventTypeSegments .choice-segment[data-mode="RecentClips"]');
    if (seg) { seg.click(); await s(700); }
    // 横屏的筛选面是折起来的：不展开就看不见摘要行。
    if (innerWidth > innerHeight) {
        const sb = document.querySelector('.sidebar');
        if (sb && !sb.classList.contains('filters-open')) {
            const t = document.getElementById('filterToggleBtn');
            if (t) { t.click(); await s(500); }
        }
    }
    const n = document.getElementById('filterNote');
    if (!n) return JSON.stringify({ err: 'no note' });
    n.scrollIntoView({ block: 'center' });
    await s(400);
    const r = n.getBoundingClientRect();
    const cs = getComputedStyle(n);
    return JSON.stringify({
        orient: `${innerWidth}x${innerHeight}`, lang,
        box: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
        fs: cs.fontSize, color: cs.color, lh: cs.lineHeight, display: cs.display,
        text: n.textContent.slice(0, 30),
    });
})()

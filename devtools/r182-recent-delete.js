// R182 · 「最近」删不掉是不是设计如此：分型别读出两条删除入口的真实状态。
// 全程不删任何文件（只在 targets 为 null 的分支上问 UI 给了什么）。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const byType = {};
    (v.eventGroups || []).forEach(e => { byType[e.eventType] = (byType[e.eventType] || 0) + 1; });
    const pick = (t) => (v.eventGroups || []).find(e => e.eventType === t);
    const cardOf = (ev) => ev && document.querySelector(`[data-event-id="${CSS.escape(ev.eventId)}"]`);
    const probe = (ev) => {
        if (!ev) return null;
        const targets = v.eventDeleteTargets(ev);
        const card = cardOf(ev);
        const seg = (ev.segments || [])[0];
        const firstPath = seg ? Object.values(seg.files || {})[0]?.path || '' : '';
        const dirTail = firstPath.slice(0, firstPath.lastIndexOf('/')).split('/').pop();
        return {
            type: ev.eventType,
            segs: (ev.segments || []).length,
            // 只回目录名那一层，不回完整路径
            dirTail,
            targets: targets ? targets.length : null,
            cardFound: !!card,
            swipeable: !!card && card.classList.contains('swipeable'),
            swipeBtn: !!card && !!card.querySelector('.row-swipe-delete'),
        };
    };
    const recent = pick('RecentClips');
    const other = pick('SentryClips') || pick('SavedClips');
    const out = { dir: (localStorage.getItem('tdashcam.mediaDir') || '').split('/').pop(),
        split: localStorage.getItem('tdashcam.recentSplit'), byType, recent: probe(recent), other: probe(other) };
    // 长按菜单：那一行到底是 hidden 还是仍然画着
    const menuState = async (ev) => {
        if (!ev) return null;
        v.showCardContextMenu(ev);
        await sleep(260);
        const menu = document.querySelector('.card-context-menu');
        const row = menu && menu.querySelector('[data-context="delete"]');
        const cs = row ? getComputedStyle(row) : null;
        const r = row ? row.getBoundingClientRect() : null;
        const st = {
            menuShown: !!menu && menu.classList.contains('show'),
            rowExists: !!row,
            hiddenAttr: row ? row.hidden : null,
            display: cs ? cs.display : null,
            box: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null,
            rowsVisible: menu ? [...menu.querySelectorAll('.menu-choice, [data-context]')]
                .filter(n => getComputedStyle(n).display !== 'none' && !n.hidden).length : 0,
        };
        menu && menu.classList.remove('show');
        v.hideCardContextMenu && v.hideCardContextMenu();
        await sleep(120);
        return st;
    };
    out.recentMenu = await menuState(recent);
    out.otherMenu = await menuState(other);
    return JSON.stringify(out);
})()

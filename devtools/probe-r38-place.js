// R38: the address in a touch row must stop pretending to be a link, and the long-press menu
// must carry a working 「查看位置」 that fits on screen. Read-only; opening the menu is done with
// a real adb long-press, this only reports what the shipped code produced.
(() => {
    const ids = Array.from(document.querySelectorAll('.city-link'));
    const link = ids.find((el) => el.offsetParent !== null) || ids[0];
    const linkCs = link ? getComputedStyle(link) : null;

    const menu = document.querySelector('.card-context-menu');
    const open = !!(menu && !menu.hidden && menu.offsetParent !== null);
    const place = menu ? menu.querySelector('[data-context="place"]') : null;
    const rows = menu
        ? Array.from(menu.querySelectorAll('.context-item')).filter((r) => !r.hidden && r.offsetParent !== null)
        : [];
    const mr = menu && open ? menu.getBoundingClientRect() : null;

    const map = document.getElementById('mapModal');

    return {
        cityLinks: ids.length,
        linkVisibleSample: link ? {
            text: link.textContent.trim(),
            color: linkCs.color,
            fontWeight: linkCs.fontWeight,
            cursor: linkCs.cursor,
            rowBgColor: getComputedStyle(link.closest('.video-card') || link.parentElement).color,
        } : null,
        menuOpen: open,
        menuRect: mr ? {
            top: Math.round(mr.top), bottom: Math.round(mr.bottom),
            left: Math.round(mr.left), right: Math.round(mr.right),
            w: Math.round(mr.width), h: Math.round(mr.height),
        } : null,
        menuInViewport: mr ? (mr.top >= 0 && mr.bottom <= innerHeight + 0.5 && mr.left >= 0 && mr.right <= innerWidth + 0.5) : null,
        menuRows: rows.map((r) => r.textContent.trim()),
        placeLabel: place ? place.textContent.trim() : null,
        placeHidden: place ? !!place.hidden : null,
        mapModalVisible: !!(map && !map.hidden && map.offsetParent !== null),
        vp: innerWidth + 'x' + innerHeight,
    };
})()

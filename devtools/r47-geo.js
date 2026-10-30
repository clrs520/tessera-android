(() => {
    const out = {};
    const html = document.documentElement;
    out.classes = html.className;
    out.viewport = [window.innerWidth, window.innerHeight];

    const modal = document.getElementById('androidDirModal');
    const panel = modal.querySelector('.modal-content');
    const cs = getComputedStyle(modal);
    const ps = getComputedStyle(panel);
    out.overlayAlign = cs.alignItems;
    out.overlayDisplay = cs.display;
    out.radius = [ps.borderTopLeftRadius, ps.borderBottomLeftRadius, ps.borderTopRightRadius];
    out.transform = ps.transform;
    out.overflowXY = [panel.scrollWidth, panel.clientWidth, panel.scrollHeight, panel.clientHeight];

    const r = panel.getBoundingClientRect();
    const mr = modal.getBoundingClientRect();
    out.panel = {
        x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        gapBottom: Math.round(mr.bottom - r.bottom),
    };

    const g = panel.querySelector('.sheet-grabber');
    out.grabber = g ? {
        display: getComputedStyle(g).display,
        h: Math.round(g.getBoundingClientRect().width) + 'x' + Math.round(g.getBoundingClientRect().height),
        touchAction: getComputedStyle(g).touchAction,
        pillW: getComputedStyle(g, '::after').width,
    } : 'missing';

    const close = document.getElementById('androidDirCloseBtn');
    const cr = close.getBoundingClientRect();
    out.closeBtn = {
        xFromPanel: Math.round(cr.left - r.left), yFromPanel: Math.round(cr.top - r.top),
        w: Math.round(cr.width), h: Math.round(cr.height),
    };
    out.titlePadLeft = getComputedStyle(document.getElementById('androidDirModalTitle')).paddingLeft;

    const items = Array.from(panel.querySelectorAll('.dir-browser-item'));
    out.rows = items.length;
    if (items.length) {
        const s = getComputedStyle(items[0]);
        const after = getComputedStyle(items[0], '::after');
        const before = items[1] ? getComputedStyle(items[1], '::before') : null;
        out.row = {
            border: s.borderTopWidth, radius: s.borderTopLeftRadius, minH: s.minHeight,
            h: Math.round(items[0].getBoundingClientRect().height),
            fontSize: s.fontSize,
            chevron: after.width + '/' + after.height + ' right=' + after.right + ' content=' + after.content,
            sep: before ? before.height + ' left=' + before.left + ' right=' + before.right : 'n/a',
        };
    }
    const more = panel.querySelector('.dir-browser-more');
    out.more = more ? { border: getComputedStyle(more).borderTopWidth, color: getComputedStyle(more).color } : 'none';

    out.tabLabelSize = getComputedStyle(document.querySelector('.tab-label')).fontSize;
    out.contrastMM = window.matchMedia('(prefers-contrast: more)').media;
    out.contrastOn = window.matchMedia('(prefers-contrast: more)').matches;
    out.transparencyMM = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
    out.where = document.getElementById('androidDirWhereName').textContent;
    out.events = window.viewer && window.viewer.eventGroups ? window.viewer.eventGroups.length : -1;
    out.mediaDir = localStorage.getItem('tdashcam.mediaDir') || '';
    return JSON.stringify(out);
})()

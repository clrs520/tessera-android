(function () {
    // The ⋮ panel is now fully two-column, so the two things that can go wrong are:
    // a cell whose label gets ellipsised (half width), and a row that lands in the wrong column.
    var panel = [].slice.call(document.querySelectorAll('.header-actions-group'))
        .find(function (e) { return e.getBoundingClientRect().width > 0; });
    if (!panel) return JSON.stringify({ panel: 'closed' });

    var pr = panel.getBoundingClientRect();
    var out = {
        viewport: [innerWidth, innerHeight],
        lang: (window.viewer && window.viewer.currentLanguage) || '?',
        panelW: +pr.width.toFixed(1),
        panelH: +pr.height.toFixed(1),
        scroll: [panel.scrollHeight, panel.clientHeight],
        display: getComputedStyle(panel).display,
        cols: getComputedStyle(panel).gridTemplateColumns,
        rows: []
    };

    [].slice.call(panel.children).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (el.classList.contains('menu-divider')) {
            out.rows.push({ g: (el.textContent || '').trim() });
            return;
        }
        var text = el.querySelector('.btn-text');
        var icon = el.querySelector('.btn-icon');
        var tr = text ? text.getBoundingClientRect() : null;
        var ir = icon ? icon.getBoundingClientRect() : null;
        out.rows.push({
            t: (text ? text.textContent : el.textContent).trim().slice(0, 22),
            col: ir ? +(ir.left - pr.left).toFixed(1) : null,
            w: +r.width.toFixed(1),
            // clipped == the ellipsis case the two-column change risks
            clipped: tr ? text.scrollWidth > text.clientWidth + 1 : null,
            avail: tr ? text.clientWidth : null,
            need: tr ? text.scrollWidth : null
        });
    });
    return JSON.stringify(out);
})()

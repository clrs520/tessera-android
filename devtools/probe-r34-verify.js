/* Round 34 verification probe (read-only, geometry only).
   R34-1: every row of the export sheet must share one content column — the time-range row was
          centred against fixed-width inputs and stopped ~10px short of it.
   R34-3: in the ⋮ panel and the long-press menu the icon *boxes* lined up but the *ink* did not;
          report box edges, ink centres and text left edges, plus the outliers.
   Run with the sheet / panel already open (real taps, not element.click()). */
(function () {
    function px(v) { return Math.round(parseFloat(v) * 10) / 10; }
    function boxRel(el, host) {
        const a = el.getBoundingClientRect();
        const b = host.getBoundingClientRect();
        return {
            l: Math.round((a.left - b.left) * 10) / 10,
            r: Math.round((a.right - b.left) * 10) / 10,
            w: Math.round(a.width * 10) / 10,
            top: Math.round((a.top - b.top) * 10) / 10,
            midY: Math.round(((a.top + a.height / 2) - b.top) * 10) / 10
        };
    }
    function inkBox(svg) {
        const path = svg.querySelector('path');
        if (!path) return null;
        let bb;
        try { bb = path.getBBox(); } catch (e) { return null; }
        const vb = (svg.getAttribute('viewBox') || '').split(/\s+|,/).map(Number);
        const r = svg.getBoundingClientRect();
        if (!bb || vb.length < 4 || !bb.width || !bb.height) return null;
        // map path bbox into the svg's client box
        const sx = r.width / vb[2];
        const sy = r.height / vb[3];
        return {
            cx: Math.round(((bb.x + bb.width / 2 - vb[0]) * sx + (r.left - vbRectCache.left)) * 10) / 10,
            cy: Math.round(((bb.y + bb.height / 2 - vb[1]) * sy + (r.top - vbRectCache.top)) * 10) / 10,
            w: Math.round(bb.width * sx * 10) / 10,
            h: Math.round(bb.height * sy * 10) / 10,
            vb: vb.map(function (n) { return Math.round(n * 100) / 100; }).join(' ')
        };
    }
    let vbRectCache = { left: 0, top: 0 };

    const out = { viewport: [window.innerWidth, window.innerHeight], css: document.documentElement.className };

    /* ---------- R34-1 export sheet column ---------- */
    const sheet = document.getElementById('phoneExportModal');
    if (sheet && getComputedStyle(sheet).display !== 'none') {
        const body = sheet.querySelector('.pe-body');
        const host = body || sheet;
        const hb = host.getBoundingClientRect();
        vbRectCache = { left: hb.left, top: hb.top };
        const rows = [];
        sheet.querySelectorAll('.pe-group').forEach(function (g, i) {
            // first visible child that carries the row's ink: label / chips / inputs / buttons
            const probe = g.querySelector('.pe-chips, .pe-range-times, .pe-mark-row, input, .seg-ctl, .pe-grid');
            if (!probe) return;
            const rr = boxRel(probe, host);
            rows.push({
                i: i,
                kind: (probe.className || 'n').toString().split(' ')[0],
                label: ((g.querySelector('.pe-label') || {}).textContent || '').trim().slice(0, 6),
                l: rr.l, r: rr.r, w: rr.w
            });
        });
        const ls = rows.map(function (x) { return x.l; });
        const rs = rows.map(function (x) { return x.r; });
        const btns = sheet.querySelector('.modal-buttons');
        out.exportSheet = {
            rows: rows,
            leftSpread: Math.round((Math.max.apply(null, ls) - Math.min.apply(null, ls)) * 10) / 10,
            rightSpread: Math.round((Math.max.apply(null, rs) - Math.min.apply(null, rs)) * 10) / 10,
            bodyPad: [px(getComputedStyle(host).paddingLeft), px(getComputedStyle(host).paddingRight)],
            footer: btns ? boxRel(btns, host) : null
        };
    } else {
        out.exportSheet = 'closed';
    }

    /* ---------- R34-3 icon panels ---------- */
    function panelReport(hostSel, itemSel, name) {
        const hostEl = name === 'header' ? window.__r34Panel : document.querySelector(hostSel);
        if (!hostEl || getComputedStyle(hostEl).display === 'none' || !hostEl.getBoundingClientRect().width) return name + ':closed';
        const items = [].slice.call(hostEl.querySelectorAll(itemSel));
        const rows = [];
        items.forEach(function (it) {
            const icon = it.querySelector('.btn-icon, .context-icon');
            if (!icon) return;
            const svg = icon.querySelector('svg');
            const ib = boxRel(icon, hostEl);
            const label = it.querySelector('.btn-label, .context-label, span:not(.btn-icon):not(.badge)');
            const lb = label ? boxRel(label, hostEl) : null;
            let ink = null;
            if (svg) {
                const hb = hostEl.getBoundingClientRect();
                vbRectCache = { left: hb.left, top: hb.top };
                ink = inkBox(svg);
            }
            rows.push({
                txt: (it.textContent || '').trim().replace(/\s+/g, '').slice(0, 8),
                iconL: ib.l, iconW: ib.w, iconMidY: ib.midY,
                textL: lb ? lb.l : null, textMidY: lb ? lb.midY : null,
                inkW: ink ? ink.w : null, inkH: ink ? ink.h : null,
                offX: ink ? Math.round((ink.cx - (ib.l + ib.w / 2)) * 10) / 10 : null,
                offY: ink ? Math.round((ink.cy - ib.midY) * 10) / 10 : null,
                viewBox: ink ? ink.vb : null
            });
        });
        const med = function (arr) {
            const v = arr.filter(function (x) { return x != null; }).sort(function (a, b) { return a - b; });
            return v.length ? v[Math.floor(v.length / 2)] : null;
        };
        const ml = med(rows.map(function (r) { return r.iconL; }));
        const mw = med(rows.map(function (r) { return r.iconW; }));
        const tl = med(rows.map(function (r) { return r.textL; }));
        return {
            name: name,
            n: rows.length,
            medianIconL: ml, medianIconW: mw, medianTextL: tl,
            iconOutliers: rows.filter(function (r) { return ml == null || mw == null || Math.abs(r.iconL - ml) > 0.6 || Math.abs(r.iconW - mw) > 0.6; })
                .map(function (r) { return r.txt + ' L' + r.iconL + ' W' + r.iconW; }),
            textOutliers: rows.filter(function (r) { return r.textL != null && tl != null && Math.abs(r.textL - tl) > 0.6; })
                .map(function (r) { return r.txt + ' ' + r.textL; }),
            inkAsymmetry: rows.map(function (r) { return r.txt + ' dx' + (r.offX == null ? '-' : r.offX) + ' dy' + (r.offY == null ? '-' : r.offY) + ' max' + (r.inkW == null ? '-' : Math.max(r.inkW, r.inkH)); }),
            rows: rows
        };
    }
    // On a phone the ⋮ rows live in a bottom sheet that is the same `.header-actions-group`
    // element, so gate on "is it on screen" rather than on `.header-collapsed`.
    const panelEl = [].slice.call(document.querySelectorAll('.header-actions-group'))
        .find(function (e) { return e.getBoundingClientRect().width > 0; });
    window.__r34Panel = panelEl || null;
    out.headerPanel = panelReport('.header-actions-group', '.header-actions-group > button', 'header');
    out.contextMenu = panelReport('.card-context-menu.show', '.card-context-menu .context-item', 'long-press');

    /* ---------- R34-2 boot state ---------- */
    out.boot = {
        phoneBootClass: document.documentElement.classList.contains('phone-boot'),
        sidebarCollapsed: !!document.querySelector('.sidebar.collapsed'),
        sidebarTransform: getComputedStyle(document.querySelector('.sidebar')).transform,
        overlayActive: !!document.querySelector('.sidebar-overlay.active, .overlay.active')
    };

    return JSON.stringify(out, null, 1);
})()

// Round-32 item probe: the layout facts behind items 3-7, measured in the live page.
(() => {
    const v = window.viewer;
    const out = {};
    const rect = (el) => el ? [Math.round(el.getBoundingClientRect().x), Math.round(el.getBoundingClientRect().y),
        Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)] : null;
    const cs = (sel, props) => {
        const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
        if (!el) return null;
        const c = getComputedStyle(el), r = el.getBoundingClientRect(), o = { rect: rect(el) };
        props.forEach(p => { o[p] = c[p]; });
        return o;
    };
    const visible = (el) => {
        if (!el) return false;
        const c = getComputedStyle(el);
        return c.display !== 'none' && c.visibility !== 'hidden' && el.getBoundingClientRect().height > 0;
    };

    out.vp = [innerWidth, innerHeight, innerWidth > innerHeight ? 'landscape' : 'portrait'];
    out.dark = document.body.classList.contains('dark-theme');
    out.events = v ? (v.eventGroups || []).length : -1;
    out.current = v?.currentEvent?.eventId || null;
    out.jsError = document.querySelector('.js-error-banner')?.style?.display || 'none';

    // 1. trigger highlight
    out.trigger = { pref: localStorage.getItem('tdashcam.triggerHighlight'),
                    enabled: v?.triggerHighlightEnabled?.(),
                    camCells: document.querySelectorAll('#playerArea .video-container.trigger-cam').length };

    // 2. tap-entry mode
    out.tap = { pref: localStorage.getItem('tdashcam.tapBehavior'),
                btnLabel: document.getElementById('tapBehaviorBtn')?.textContent.trim(),
                offset: v?.eventOffsetSeconds?.(v?.currentEvent),
                currentTime: v?.continuousPlayer?.currentTime ?? null,
                duration: v?.totalDuration ?? v?.videoControls?.totalDuration ?? null };

    // 3. route track offline: map sheet carries only the external-map buttons
    const mapModal = document.getElementById('mapModal');
    out.route = { modalOpen: visible(mapModal),
                  groupShown: visible(document.querySelector('.route-map-group')),
                  groupCss: cs('.route-map-group', ['display'])?.display,
                  canvases: mapModal ? mapModal.querySelectorAll('canvas').length : -1,
                  buttons: [...(mapModal?.querySelectorAll('button') || [])]
                      .map(b => (b.textContent.trim() || b.dataset.i18n || b.className) + (visible(b) ? '' : '(hidden)')) };

    // 4+5. export sheet: size chips, group layout, cap
    const modal = document.getElementById('phoneExportModal');
    const panel = modal?.querySelector('.phone-export-panel');
    const body = modal?.querySelector('.pe-body');
    const groups = body ? [...body.querySelectorAll('.pe-group')] : [];
    out.export = {
        open: modal ? getComputedStyle(modal).display : 'missing',
        panelMaxH: panel ? getComputedStyle(panel).maxHeight : null,
        panelRect: rect(panel),
        bodyScroll: body ? [body.scrollHeight, body.clientHeight, Math.round(body.scrollTop)] : null,
        sizeChips: [...document.querySelectorAll('#peSizeChips button')]
            .map(c => (c.textContent.trim() || c.dataset.size) + '=' + c.dataset.size + (c.classList.contains('active') ? '*' : '')),
        groups: groups.map(g => ({ label: g.querySelector('.pe-label')?.textContent.trim() || '',
                                   shown: visible(g),
                                   top: Math.round(g.getBoundingClientRect().top),
                                   bottom: Math.round(g.getBoundingClientRect().bottom) })),
        footerVisible: visible(panel?.querySelector('.modal-buttons')),
        startBtn: rect(document.getElementById('peStartBtn')),
        rangeRows: ['pe-range-times', 'pe-range-actions'].map(c => {
            const el = document.querySelector('.' + c);
            return { cls: c, shown: visible(el), rect: rect(el),
                     clipped: el ? [...el.querySelectorAll('button,input,span')].filter(n => n.scrollWidth > n.clientWidth + 1).length : -1 };
        }),
    };

    // 6. hero: no fixed big image in either orientation
    out.hero = { shown: visible(document.querySelector('.empty-hero')),
                 css: cs('.empty-hero', ['display', 'backgroundImage', 'height']),
                 text: (document.querySelector('.empty-hero')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
                 imgs: [...document.querySelectorAll('.empty-hero img')].map(i => ({ src: (i.src || '').split('/').pop(), rect: rect(i) })),
                 playerEmpty: document.getElementById('playerArea')?.classList.contains('empty') };

    // 7. driving-data plate: label column must not move when the value changes
    const plate = document.querySelector('.stats-overlay');
    const rows = [...(plate?.querySelectorAll('.stats-row') || [])];
    out.stats = { shown: visible(plate), rect: rect(plate),
                  folded: plate?.classList.contains('folded'),
                  resized: plate?.classList.contains('resized'),
                  stylePos: plate ? [plate.style.left || 'auto', plate.style.top || 'auto'] : null,
                  gridCols: plate ? getComputedStyle(rows[0] || plate).gridTemplateColumns : null,
                  rows: rows.slice(0, 5).map(r => {
                      const lab = r.querySelector('.stats-label, .label'), val = r.querySelector('.stats-value, .value');
                      return { text: r.textContent.replace(/\s+/g, ' ').trim().slice(0, 26),
                               labelRight: lab ? Math.round(lab.getBoundingClientRect().right) : null,
                               valueLeft: val ? Math.round(val.getBoundingClientRect().left) : null };
                  }),
                  pref: localStorage.getItem('tdashcam.statsPlate'),
                  foldBtn: cs('.stats-overlay .stats-fold', ['width', 'height']) };
    // Overlap with the picture is what the user complained about in landscape.
    const feed = [...document.querySelectorAll('#playerArea .video-container')].map(c => rect(c));
    const pr = plate?.getBoundingClientRect();
    out.statsOverlaps = plate && visible(plate) && !plate.classList.contains('folded')
        ? feed.filter(r => r && pr && !(pr.right <= r[0] || pr.left >= r[0] + r[2] || pr.bottom <= r[1] || pr.top >= r[1] + r[3])).length
        : 0;

    return JSON.stringify(out, null, 1);
})();

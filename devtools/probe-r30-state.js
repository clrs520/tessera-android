(() => {
    const cs = (sel, prop) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el)[prop] : null;
    };
    const plate = document.getElementById('metaDetailOverlay');
    const content = plate && plate.querySelector('.stats-content');
    const rows = content ? [...content.querySelectorAll('.stats-row')] : [];
    const sidebar = document.querySelector('.sidebar');
    const drawerOpen = sidebar && !sidebar.classList.contains('collapsed');
    const row = drawerOpen ? sidebar.querySelector('.video-card') : null;

    const hits = {};
    if (row) {
        const b = row.getBoundingClientRect();
        [[b.left + b.width / 2, b.top + 12], [b.left + 10, b.top + b.height / 2], [b.left + b.width / 2, b.bottom - 10]]
            .forEach(([x, y], i) => {
                const el = document.elementFromPoint(x, y);
                hits['rowhit' + i] = el ? (el.className || el.tagName) + '' : null;
                hits['inDrawer' + i] = !!(el && sidebar.contains(el));
            });
    }

    const ctx = document.getElementById('cardContextMenu');
    const menu = ctx && ctx.classList.contains('show') ? ctx.getBoundingClientRect() : null;
    const menuHits = [];
    if (menu) {
        [...ctx.querySelectorAll('.context-item')].forEach((item, i) => {
            const b = item.getBoundingClientRect();
            const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            menuHits.push({ i, label: item.textContent.trim(), ok: !!(el && ctx.contains(el)) });
        });
    }

    const vids = [...document.querySelectorAll('.video-container video')];
    return JSON.stringify({
        z: {
            sidebar: cs('.sidebar', 'zIndex'),
            overlay: cs('#overlay', 'zIndex'),
            overlayActive: document.getElementById('overlay')?.classList.contains('active'),
            plate: cs('#metaDetailOverlay', 'zIndex'),
            plateShown: plate && plate.classList.contains('show'),
            ctxMenu: cs('#cardContextMenu', 'zIndex'),
            header: cs('.main-header', 'zIndex'),
            moreOpen: document.getElementById('headerRight')?.classList.contains('active'),
            bodyClasses: [...document.body.classList].join(' '),
        },
        drawer: {
            open: !!drawerOpen,
            rowRect: row ? { x: Math.round(row.getBoundingClientRect().left), y: Math.round(row.getBoundingClientRect().top), w: Math.round(row.getBoundingClientRect().width) } : null,
            hits,
        },
        menuHits,
        plateFit: content ? {
            resized: plate.classList.contains('resized'),
            dense: plate.classList.contains('stats-dense'),
            box: { w: Math.round(plate.getBoundingClientRect().width), h: Math.round(plate.getBoundingClientRect().height) },
            // Where the box sits, and how far its right edge is from the screen edge — the resize
            // grip has to stay clear of Android's back-gesture band or shrinking the card closes the app.
            rightGap: Math.round(innerWidth - plate.getBoundingClientRect().right),
            font: content.style.getPropertyValue('--stats-font') || getComputedStyle(content).fontSize,
            cols: getComputedStyle(content).gridTemplateColumns.split(' ').length,
            rows: rows.length,
            scrollH: content.scrollHeight,
            clientH: content.clientHeight,
            scrollW: content.scrollWidth,
            clientW: content.clientWidth,
            clippedRows: rows.filter(r => r.getBoundingClientRect().bottom > content.getBoundingClientRect().bottom + 1).length,
        } : null,
        speed: {
            offered: [...document.querySelectorAll('.speed-options [data-speed]')].map(d => d.dataset.speed),
            active: document.querySelector('.speed-options div.active')?.dataset.speed,
            rates: [...new Set(vids.map(v => v.playbackRate))],
            open: document.getElementById('speedControl')?.classList.contains('active'),
            menuTop: document.querySelector('.speed-options')?.getBoundingClientRect?.().top,
        },
        feeds: {
            zoom: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-zoom') || '1'),
            pan: [...document.querySelectorAll('.video-container')].map(c => c.style.getPropertyValue('--feed-pan-x') + ',' + c.style.getPropertyValue('--feed-pan-y')),
            zoomedTiles: [...document.querySelectorAll('.video-container.feed-zoomed')].map(c => c.dataset.camera),
            transformOfVideo: vids[0] ? getComputedStyle(vids[0]).transform : null,
            decodeNotes: document.querySelectorAll('.feed-decode-note').length,
        },
        layout: {
            vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
            grid: document.getElementById('playerArea')?.className,
            jsErrors: (window.viewer && window.viewer.recentErrors) || [],
            banner: document.getElementById('jsErrorBanner')?.style.display !== 'none'
                ? document.getElementById('jsErrorText')?.textContent : null,
        },
    }, null, 1);
})();

(() => {
    const mq = q => window.matchMedia(q).matches;
    const rect = el => el ? {
        x: Math.round(el.getBoundingClientRect().left),
        y: Math.round(el.getBoundingClientRect().top),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
    } : null;
    const cssVar = (sel, name) => getComputedStyle(document.querySelector(sel) || document.documentElement).getPropertyValue(name).trim();

    const sidebar = document.querySelector('.sidebar');
    const bar = document.querySelector('.phone-action-bar');
    const header = document.querySelector('.main-header');
    const group = document.querySelector('.header-actions-group');
    const chips = document.getElementById('androidDirVolumeChips');
    const about = document.getElementById('aboutModal');
    const aboutPanel = about && about.querySelector('.about-panel');

    // Same exclusion list as the older fit probes: the closed drawer is off-screen by design,
    // and overlays/modals are measured by their own section below.
    const overflowing = [...document.querySelectorAll('body *')]
        .filter(e => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && (b.right > innerWidth + 2 || b.left < -2)
                && getComputedStyle(e).position !== 'fixed'
                && !/overlay|modal|sidebar|toast|context-menu/i.test(e.className + '');
        })
        .slice(0, 8)
        .map(e => (e.id ? '#' + e.id : '.' + (e.className || '').toString().split(' ')[0]) +
            ' right=' + Math.round(e.getBoundingClientRect().right));

    const smallTouch = [...document.querySelectorAll('button')]
        .filter(e => e.offsetParent)
        .map(e => {
            const b = e.getBoundingClientRect();
            return { t: (e.getAttribute('aria-label') || e.textContent || e.id).trim().replace(/\s+/g, ' ').slice(0, 14), w: Math.round(b.width), h: Math.round(b.height) };
        })
        .filter(x => x.w > 0 && (x.w < 40 || x.h < 40))
        .slice(0, 8);

    const tabs = [...document.querySelectorAll('.tab-btn')].map(e => e.getBoundingClientRect());

    const menuRows = group ? [...group.querySelectorAll('button, a')].map(item => {
        const b = item.getBoundingClientRect();
        return {
            id: item.id || null,
            label: (item.textContent || '').trim().replace(/\s+/g, '').slice(0, 10),
            shown: b.width > 0 && b.height > 0,
            h: Math.round(b.height),
            textVisible: item.querySelector('.btn-text')
                ? getComputedStyle(item.querySelector('.btn-text')).display !== 'none' : null,
        };
    }) : [];

    return JSON.stringify({
        screen: {
            w: Math.round(innerWidth), h: Math.round(innerHeight), dpr: Math.round(devicePixelRatio * 1000) / 1000,
            coarse: mq('(hover: none) and (pointer: coarse)'),
            fine: mq('(pointer: fine)'),
            touchUi: document.documentElement.classList.contains('touch-ui'),
            phoneLayout: mq('(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px), (hover: none) and (pointer: coarse)'),
            tabletLayout: mq('(hover: none) and (pointer: coarse) and (min-width: 769px)'),
            headerCollapsed: header ? header.classList.contains('header-collapsed') : null,
        },
        doc: { hOverflow: document.documentElement.scrollWidth - innerWidth, vOverflow: document.documentElement.scrollHeight - innerHeight },
        geometry: {
            sidebar: rect(sidebar),
            sidebarMaxW: cssVar('.sidebar', 'max-width'),
            gutter: cssVar('.sidebar', '--gutter'),
            fieldH: cssVar('.sidebar', '--field-h'),
            bar: rect(bar),
            barTabH: tabs.length ? Math.round(tabs[0].height) : 0,
            tabsOnScreen: tabs.length ? tabs.every(b => b.bottom <= innerHeight + 1 && b.right <= innerWidth + 1 && b.left >= -1) : null,
            safeTop: cssVar('html', '--safe-top'),
            safeBottom: cssVar('html', '--safe-bottom'),
        },
        menu: {
            rows: menuRows,
            shownRows: menuRows.filter(r => r.shown).length,
            panel: rect(group),
            open: document.getElementById('headerRight') ? document.getElementById('headerRight').classList.contains('active') : null,
            scroll: group ? { sh: group.scrollHeight, ch: group.clientHeight } : null,
        },
        chips: chips ? {
            count: chips.children.length,
            list: [...chips.children].map(c => ({
                text: c.textContent.trim().replace(/\s+/g, ' ').slice(0, 24),
                path: c.dataset.path,
                cls: c.className.replace('dir-volume-chip ', ''),
                disabled: c.disabled,
                h: Math.round(c.getBoundingClientRect().height),
            })),
            warn: document.getElementById('androidDirVolumeWarn') ? document.getElementById('androidDirVolumeWarn').style.display : null,
        } : null,
        about: aboutPanel ? {
            shown: about.classList.contains('show'),
            panel: rect(aboutPanel),
            version: document.getElementById('aboutVersionValue') ? document.getElementById('aboutVersionValue').textContent : null,
            device: document.getElementById('aboutDeviceValue') ? document.getElementById('aboutDeviceValue').textContent : null,
            contact: document.getElementById('aboutCopyContactBtn') ? document.getElementById('aboutCopyContactBtn').textContent : null,
            qr: rect(document.querySelector('.about-qr')),
            fits: aboutPanel.scrollHeight <= aboutPanel.clientHeight + 1,
            scroll: { sh: aboutPanel.scrollHeight, ch: aboutPanel.clientHeight },
        } : null,
        smallTouch,
        overflowing,
        errors: window.viewer && window.viewer.recentErrors ? window.viewer.recentErrors.length : 0,
        banner: document.getElementById('jsErrorBanner') && document.getElementById('jsErrorBanner').style.display !== 'none'
            ? (document.getElementById('jsErrorText') || {}).textContent : 'none',
    });
})();

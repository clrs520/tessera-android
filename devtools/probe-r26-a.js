// R26 verification, part A: capability + static UI presence. Synchronous IIFE.
(() => {
    const r = {};
    r.version = document.getElementById('appVersion')?.textContent?.trim() || null;
    r.fns = ['renderUsbGuide', 'dismissUsbGuide', 'openDeleteConfirm', 'closeDeleteConfirm',
        'confirmDeleteEvent', 'eventDeleteTargets', 'queueFrameThumb', 'ensureThumbObserver',
        'buildClipFilmstrip', 'hideClipFilmstrip', 'clipFrameTarget', 'renderTypeSeg']
        .map(n => n + (typeof viewer[n] === 'function')).join(',');
    r.frameFetcher = typeof FrameFetcher;
    r.ffKeys = typeof FrameFetcher === 'object' ? Object.keys(FrameFetcher).join('|') : null;
    r.typeSeg = (() => {
        const s = document.getElementById('typeSeg');
        if (!s) return 'MISSING';
        return [...s.querySelectorAll('button')].map(b => `${b.dataset.type || b.dataset.value}|${b.textContent.trim()}|${b.getAttribute('aria-pressed')}|${b.className}`).join('  ||  ');
    })();
    r.typeSegBox = (() => {
        const s = document.getElementById('typeSeg');
        if (!s) return null;
        const b = s.querySelector('button');
        return { disp: getComputedStyle(s).display, btnH: b ? Math.round(b.getBoundingClientRect().height) : 0, minH: b ? getComputedStyle(b).minHeight : null, segRect: JSON.stringify(s.getBoundingClientRect()) };
    })();
    r.oldSelect = (() => {
        const e = document.getElementById('eventFilter');
        if (!e) return 'gone';
        return { tag: e.tagName, disp: getComputedStyle(e.parentElement || e).display, hidden: e.hidden };
    })();
    r.cards = document.querySelectorAll('#fileList .video-card').length;
    r.cardTimes = [...document.querySelectorAll('#fileList .video-time')].slice(0, 8).map(x => x.textContent.trim().replace(/\s+/g, ' '));
    r.noThumb = document.querySelectorAll('#fileList .no-thumb').length;
    r.frameThumbs = document.querySelectorAll('#fileList .video-thumbnail > img').length;
    r.deleteRow = (() => {
        const b = document.querySelector('#cardContextMenu [data-context="delete"]');
        return b ? { hidden: b.hidden, text: b.textContent.trim(), color: getComputedStyle(b).color } : 'MISSING';
    })();
    r.deleteModal = (() => {
        const m = document.getElementById('deleteConfirmModal');
        if (!m) return 'MISSING';
        return { disp: m.style.display, cls: !!m.querySelector('.delete-confirm-modal'), btns: [...m.querySelectorAll('button')].map(b => b.id).join(',') };
    })();
    r.usbGuide = (() => {
        const g = document.getElementById('usbGuide');
        if (!g) return 'MISSING';
        return { disp: g.style.display, title: document.getElementById('usbGuideTitle')?.textContent, steps: g.querySelectorAll('#usbGuideSteps li').length, eject: (document.getElementById('usbGuideEject')?.textContent || '').slice(0, 24) };
    })();
    r.aboutUsbBtn = !!document.getElementById('aboutUsbGuideBtn');
    r.errors = window.__jsErrors ? window.__jsErrors.slice(-4) : null;
    return JSON.stringify(r, null, 1);
})()

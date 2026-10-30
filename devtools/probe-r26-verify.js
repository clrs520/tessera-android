(() => {
    const v = window.viewer;
    const ctr = v && v.videoControls;
    const lc = v && v.videoListComponent;
    const cards = [...document.querySelectorAll('#fileList .video-card')];
    const strip = document.querySelector('.clip-filmstrip');
    const marker = document.querySelector('.timeline-event-marker');
    const painted = (el) => {
        const bi = getComputedStyle(el).backgroundImage;
        return bi && bi !== 'none' && bi.includes('data:');
    };
    return JSON.stringify({
        version: (document.querySelector('#appVersion, .app-version, #drawerVersion') || {}).textContent?.trim() || null,
        lang: v && v.currentLanguage,
        phone: v && v.phoneLayerCount ? v.phoneLayerCount() : null,

        // R26-1: real-frame thumbnails, and the retry path that only exists post-1.2.14.
        fetcher: {
            timeoutMs: window.FrameFetcher ? FrameFetcher.TIMEOUT_MS : null,
            cache: FrameFetcher ? FrameFetcher.cache.size : null,
            live: FrameFetcher ? FrameFetcher.live : null,
            waiting: FrameFetcher ? FrameFetcher.waiting.length : null,
        },
        cards: cards.length,
        thumbPainted: cards.filter(c => painted(c.querySelector('.video-thumbnail') || c)).length,
        noThumb: cards.filter(c => c.querySelector('.no-thumb')).length,
        retried: cards.filter(c => {
            const t = c.querySelector('.video-thumbnail');
            return t && t.dataset.frameRetried === '1';
        }).length,
        cardSubs: cards.slice(0, 6).map(c => {
            const sub = c.querySelector('.video-sub');
            return sub ? sub.textContent.trim() : null;
        }),

        // R26-6: filmstrip over the trim ruler.
        clip: {
            active: ctr ? ctr.clipModeActive : null,
            totalDuration: ctr ? Math.round(ctr.totalDuration * 100) / 100 : null,
            stripExists: !!strip,
            cells: strip ? strip.querySelectorAll('.filmstrip-cell').length : 0,
            cellsPainted: strip ? [...strip.querySelectorAll('.filmstrip-cell')].filter(painted).length : 0,
            trimming: document.body.classList.contains('clip-trimming'),
            confirmVisible: ctr && ctr.confirmClipBtn ? getComputedStyle(ctr.confirmClipBtn).display : null,
            speedGraphVis: (() => {
                const g = document.querySelector('.speed-graph-container');
                return g ? getComputedStyle(g).visibility : null;
            })(),
            stripBox: strip ? (() => { const r = strip.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.w || r.width), Math.round(r.height)]; })() : null,
        },

        // R26-7: event marker label locale.
        marker: marker ? {
            cls: marker.className,
            aria: marker.getAttribute('aria-label'),
            title: marker.title,
            left: marker.style.left,
        } : null,

        // R26-4: delete-sheet row naming (only readable while the sheet is open).
        deleteRows: [...document.querySelectorAll('#deleteConfirmList li')].map(li => li.textContent.trim()),
        deleteSummary: (document.getElementById('deleteConfirmSummary') || {}).textContent || null,

        // R26-5: guide wording.
        guide: (() => {
            const g = document.getElementById('usbGuide');
            if (!g || getComputedStyle(g).display === 'none') return null;
            return { steps: [...g.querySelectorAll('li, .usb-guide-step')].map(x => x.textContent.trim()), forced: v ? v.usbGuideForced : null };
        })(),
        errors: (window.__qoderErrors || []).slice(-3),
    });
})()

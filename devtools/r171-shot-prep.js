(async () => {
    const v = window.viewer;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const pad = (n) => String(n).padStart(2, '0');
    if (v.dom.sidebar.classList.contains('collapsed')) { v.toggleSidebar(true); await wait(400); }
    if (v.eventGroups.length >= 500 && v.lastScannedPath.endsWith('TeslaCamR168')) {
        const real = v.eventGroups;
        const [y, m, d] = [...new Set(real.map((e) => e.startTime.slice(0, 10)))][0].split('-').map(Number);
        const add = [12, 48, 120, 90, 40, 20];
        const clones = [];
        add.forEach((count, back) => {
            const day = new Date(y, m - 1, d - (6 - back));
            const key = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
            for (let i = 0; i < count; i += 1) {
                const src = real[(back * 97 + i) % real.length];
                clones.push({
                    ...src,
                    eventId: `${src.eventId}#shot-${back}-${i}`,
                    startTime: `${key}_${pad(9 + (i % 10))}-${pad(i % 60)}-00`,
                    segments: src.segments,
                    bytes: src.bytes || 1024,
                });
            }
        });
        v.eventGroups = [...real, ...clones];
        v.filterAndRender();
        await wait(120);
    }
    v.dom.eventFilter.value = 'SentryClips';
    v.filterAndRender();
    v.setFiltersOpen(true, false);
    v.applyTheme(false);
    await wait(500);
    const seg = document.querySelector('#eventTypeSegments .choice-segment[data-mode="SentryClips"]');
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }; };
    return JSON.stringify({
        dpr: window.devicePixelRatio,
        events: v.lastListStats.events,
        total: v.eventGroups.length,
        sheet: r(v.dom.filterStack),
        light: !document.body.classList.contains('dark-theme'),
        bars: [...document.querySelectorAll('#filterDayChart .filter-day-bar b')].map((b) => b.textContent),
        sources: [...document.querySelectorAll('#recentDirs .recent-chip')].map((c) => c.textContent.trim()),
    });
})()

// R168 · two claims, measured on the device:
//   1) a type-tab switch paints the first screenful synchronously and the rest of the page over
//      subsequent frames, so the switch no longer blocks on 60 rows;
//   2) the progressive scan draws cards from streamed batches before the walk returns, and keeps
//      the rows already on screen (append, not rebuild).
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const frames = (n = 2) => new Promise((r) => {
        let left = n;
        const tick = () => (--left <= 0 ? r() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
    });
    const v = window.viewer;
    const results = {};
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

    // ---- A. 3 000 synthetic events: the cost of one type-tab switch -------------------------
    const db = v.dom;
    db.eventFilter.value = '';
    db.dateFilter.value = '';
    if (db.eventSearch) db.eventSearch.value = '';
    v.starredOnly = false;
    v.triggerOnly = false;
    v.sortOrder = 'newest';
    const types = ['SentryClips', 'SavedClips', 'RecentClips'];
    const synthetic = [];
    for (let i = 0; i < 3000; i += 1) {
        const day = String(1 + Math.floor(i / 720)).padStart(2, '0');
        const rem = i % 720;
        const hh = String(Math.floor(rem / 60)).padStart(2, '0');
        const mm = String(rem % 60).padStart(2, '0');
        const stamp = `2026-09-${day}_${hh}-${mm}-00`;
        synthetic.push({
            eventId: `RecentClips/${stamp}`,
            eventType: types[i % 3],
            startTime: stamp,
            segments: [{ timestamp: `${stamp.slice(0, 16)}-00`, duration: 60, files: { front: { name: `${stamp}-front.mp4`, path: `/x/${stamp}-front.mp4`, size: 1048576, duration: 60 } } }],
            bytes: 1048576,
        });
    }
    v.eventGroups = synthetic;
    v.renderDateChips();

    const switchCosts = {};
    for (const type of ['SentryClips', 'RecentClips', 'SavedClips', '']) {
        db.eventFilter.value = type;
        const t0 = performance.now();
        v.filterAndRender();
        const sync = performance.now() - t0;
        const eager = document.querySelectorAll('#fileList .video-card').length;
        await frames(6);
        const settled = document.querySelectorAll('#fileList .video-card').length;
        switchCosts[type || 'all'] = {
            syncMs: Math.round(sync),
            eager,
            settled,
            events: v.lastListStats.events,
            filterMs: v.lastListStats.filterMs,
            cards: v.lastListStats.cards,
        };
        check(`tab ${type || 'all'} paints a small first batch synchronously`, eager > 0 && eager <= 14, `${eager} rows`);
        check(`tab ${type || 'all'} does not block on the 60-row page`, sync < 220, `${Math.round(sync)}ms`);
        check(`tab ${type || 'all'} fills the rest of the page`, settled >= Math.min(60, v.lastListStats.events), `${settled}/${v.lastListStats.events}`);
    }
    results.switchCosts = switchCosts;
    db.eventFilter.value = '';
    v.filterAndRender();
    await frames(6);

    // ---- B. streamed batches: preview, then append without rebuilding ------------------------
    v.clearScanSkeleton();
    v.eventGroups = [];
    v.showScanSkeleton();
    const preview = v.startScanPreview('/sdcard/TeslaCamR168');
    const stamps = [];
    for (let i = 499; i >= 0; i -= 1) {
        const hh = String(Math.floor(i / 60)).padStart(2, '0');
        const mm = String(i % 60).padStart(2, '0');
        stamps.push(`2026-09-01_${hh}-${mm}-00`);
    }
    const batchOf = (from, to) => {
        const files = [];
        const sizes = [];
        const durations = [];
        for (let i = from; i < to; i += 1) {
            const stamp = stamps[i];
            const dir = `/sdcard/TeslaCamR168/SentryClips/${stamp}`;
            for (const name of [`${stamp}-front.mp4`, 'event.json', 'thumb.png']) {
                files.push(`${dir}/${name}`);
                sizes.push(name.endsWith('.mp4') ? 1048576 : 64);
                durations.push(name.endsWith('.mp4') ? 60000 : 0);
            }
        }
        return { scan_id: 1, files, sizes, durations };
    };
    v.ingestScanBatch(batchOf(0, 30));
    v.renderScanPreview();
    await frames(3);
    const firstCards = document.querySelectorAll('#fileList .video-card');
    const firstNode = firstCards[0];
    const firstEventId = v.eventGroups[0] && v.eventGroups[0].eventId;
    const progressVisible = !!document.querySelector('#fileList ~ .scan-progress-bar, .scan-progress-bar');
    const skeletonRows = document.querySelectorAll('.scan-skeleton .skeleton-card').length;
    results.preview1 = {
        events: v.eventGroups.length,
        cards: firstCards.length,
        first: firstEventId,
        skeletonRows,
        progressVisible,
        renders: preview.renders,
    };
    check('preview paints cards from the first batch', firstCards.length > 0, `${firstCards.length} cards for ${v.eventGroups.length} events`);
    check('preview starts at the newest folder', firstEventId === 'TeslaCamR168/SentryClips/2026-09-01_08-19-00', String(firstEventId));
    check('preview removes the placeholder rows', skeletonRows === 0, `${skeletonRows} left`);
    check('scan progress line survives the first preview render', progressVisible, '');

    v.scanPreview.scrollTopGuard = 0;
    v.ingestScanBatch(batchOf(30, 60));
    v.renderScanPreview();
    await frames(3);
    const afterCards = document.querySelectorAll('#fileList .video-card');
    results.preview2 = {
        events: v.eventGroups.length,
        cards: afterCards.length,
        sameFirstNode: afterCards[0] === firstNode,
        listEvents: v.videoListComponent.listEvents.length,
        renders: v.scanPreview.renders,
    };
    check('second batch keeps the rows already on screen', afterCards[0] === firstNode, '');
    check('second batch replaces the backing array', v.videoListComponent.listEvents.length === 60, `${v.videoListComponent.listEvents.length} events`);

    if (v.scanPreview && v.scanPreview.timer) clearTimeout(v.scanPreview.timer);
    v.scanPreview = null;
    v.clearScanSkeleton();

    // ---- C. a real streamed native scan on the 505-event fixture ----------------------------
    // Honest precondition: no cards from the synthetic list may be left in the DOM, or the
    // "first card appeared" probe would pass on a card that was already there.
    v.eventGroups = [];
    v.allFiles = [];
    v.videoListComponent.listEvents = null;
    v.videoListComponent.listShown = 0;
    v.videoListComponent.listBuilt = 0;
    document.getElementById('fileList').innerHTML = '';
    const probe = { start: performance.now(), firstCardAt: 0, firstCardWasDuringScan: null, previewAliveAtFirstCard: null, barAtFirstCard: null, doneAt: 0 };
    window.__r168probe = probe;
    const poller = setInterval(() => {
        if (probe.firstCardAt) return;
        if (document.querySelectorAll('#fileList .video-card').length > 0) {
            probe.firstCardAt = Math.round(performance.now() - probe.start);
            probe.firstCardWasDuringScan = !!v.isScanning;
            probe.previewAliveAtFirstCard = !!v.scanPreview;
            probe.barAtFirstCard = !!document.querySelector('.scan-progress-bar');
        }
    }, 40);
    db.eventFilter.value = '';
    await v.loadTauriDirectory('/sdcard/TeslaCamR168');
    probe.doneAt = Math.round(performance.now() - probe.start);
    clearInterval(poller);
    await sleep(300);
    const stats = v.lastScanStats || {};
    results.scan = {
        probe,
        files: v.allFiles.length,
        events: v.eventGroups.length,
        first: v.eventGroups[0] && v.eventGroups[0].startTime,
        stats,
        list: v.lastListStats,
        barGone: !document.querySelector('.scan-progress-bar'),
    };
    check('native scan streamed more than one batch', Number(stats.streamBatches) >= 2, `${stats.streamBatches} batches`);
    check('first batch arrived before the walk ended', Number(stats.firstBatchMs) > 0 && Number(stats.firstBatchMs) < Number(stats.nativeMs), `${stats.firstBatchMs}ms of ${stats.nativeMs}ms`);
    check('a preview rendered before the walk returned', Number(stats.firstPreviewMs) > 0 && Number(stats.firstPreviewMs) < Number(stats.nativeMs), `${stats.firstPreviewMs}ms of ${stats.nativeMs}ms`);
    check('preview rendered during the scan', Number(stats.previewRenders) >= 1, `${stats.previewRenders} renders`);
    check('cards appeared while the scan was still running', probe.firstCardAt > 0 && probe.firstCardWasDuringScan === true && probe.previewAliveAtFirstCard === true, `${probe.firstCardAt}ms scanning=${probe.firstCardWasDuringScan} preview=${probe.previewAliveAtFirstCard}`);
    check('all 505 events survived the streamed scan', v.eventGroups.length === 505, `${v.eventGroups.length}`);
    check('final list is newest first', v.eventGroups[0] && v.eventGroups[0].startTime === '2026-09-01_08-19-00', String(v.eventGroups[0] && v.eventGroups[0].startTime));
    check('progress line removed when the scan ended', results.scan.barGone, '');

    window.__r168 = results;
    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        ...results,
    });
})()

// R188 #5/#2 — load the 900-event fixture and report the windowing state.
(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const t0 = performance.now();
    await v.loadTauriDirectory('/sdcard/TeslaCamBig');
    const scanMs = Math.round(performance.now() - t0);
    const c = v.videoListComponent;
    // Let the first block + its rAF fill settle.
    const t1 = performance.now();
    while (performance.now() - t1 < 3000) {
        await new Promise((r) => requestAnimationFrame(r));
    }
    return JSON.stringify({
        scanMs,
        events: v.eventGroups.length,
        files: v.allFiles.length,
        listEvents: c.listEvents?.length ?? null,
        windowed: c.listWindowed(),
        listTop: c.listTop,
        listEnd: c.listEnd,
        rows: c.listRowNodes().length,
        pitch: Math.round((c.windowPitch || 0) * 10) / 10,
        scrollTop: c.container.scrollTop,
        scrollHeight: c.container.scrollHeight,
        clientHeight: c.container.clientHeight,
        firstId: c.listEvents?.[0]?.eventId ?? null,
    });
})()

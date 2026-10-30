// R156 — real TeslaCam footage (2026-10-08), pushed to /sdcard/TeslaCamReal.
// What this asks the app, not the file names: does the scan carry each clip's own length into
// `segment.duration`, does the ruler book those lengths (not 60 s), and does a 128×83 thumb.png
// get replaced by a decoded frame wide enough for the card?
(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ error: 'no viewer' });
    v.lastScanSignature = null;
    const t0 = Date.now();
    const ok = await v.loadTauriDirectory('/storage/emulated/0/TeslaCamReal');
    const scanMs = Date.now() - t0;
    await new Promise(r => setTimeout(r, 300));

    const groups = (v.eventGroups || []).map(g => {
        const before = Date.now();
        return { event: g, before };
    });
    const report = [];
    for (const { event, before } of groups) {
        await v.continuousPlayer.calculateEventDurations(event);
        report.push({
            id: event.eventId.split('/').slice(-2).join('/'),
            city: event.city || '',
            street: event.street || '',
            reason: event.reason || '',
            thumb: event.thumbFile ? event.thumbFile.name : null,
            segs: event.segments.map(s => ({
                ts: s.timestamp,
                dur: s.duration === undefined ? null : +s.duration.toFixed(3),
                views: Object.keys(s.files).length,
            })),
            booked: (event.segmentDurations || []).map(d => +d.toFixed(3)),
            starts: (event.segmentStartTimes || []).map(d => +d.toFixed(3)),
            total: +(event.totalDuration || 0).toFixed(3),
            bookedViaProbeMs: Date.now() - before,
            cardMinutes: (document.querySelector(`.video-card[data-event-id="${event.eventId}"] .video-duration`) || {}).textContent || '',
        });
    }

    // The car's own picture is 128 px wide; the card asks the native retriever for 320 once the
    // row is on screen. Watch the first card for the swap instead of assuming it happened.
    const thumb = document.querySelector('.video-card .video-thumbnail img');
    let thumbSeen = thumb ? { w: thumb.naturalWidth, src: thumb.src.slice(0, 24) } : null;
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline && (!thumbSeen || thumbSeen.w < 300)) {
        await new Promise(r => setTimeout(r, 250));
        const now = document.querySelector('.video-card .video-thumbnail img');
        if (now) thumbSeen = { w: now.naturalWidth, src: now.src.slice(0, 24) };
    }
    const imgs = [...document.querySelectorAll('.video-card .video-thumbnail img')]
        .map(img => img.naturalWidth);

    return JSON.stringify({
        ok, scanMs, sidecarFailures: v.sidecarFailures || 0,
        files: v.allFiles.length, groups: report,
        thumbSeen, thumbWidths: imgs,
        cardCount: document.querySelectorAll('.video-card').length,
    });
})()

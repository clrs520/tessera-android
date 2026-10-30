// R169 real-finger setup. Dense synthetic holes on the live ruler (35 of them on a ~340 px bar),
// plus the card geometry the tap test needs. The synthetic ticks are gone the moment an event is
// opened again, because playEvent rebuilds the markers from that event's own gaps.
(async () => {
    const v = window.viewer;
    const vc = v.videoControls;
    if (!v.eventGroups.some((e) => e.eventId.includes('2026-10-09'))) {
        await v.loadTauriDirectory('/sdcard/TeslaCamReg2');
    }
    // The ruler is only meaningful once a clip is actually open; without this the suite measures a
    // 0 s player against a synthetic 60 s ruler and a drag cannot land anywhere.
    if (!v.currentEvent || !(v.continuousPlayer.getTotalDuration() > 0)) {
        const ev = v.eventGroups.find((e) => e.eventType === 'SentryClips') || v.eventGroups[0];
        if (ev) await v.playEvent(ev.eventId);
        await new Promise((r) => setTimeout(r, 400));
    }
    v.dom.playerArea.classList.remove('empty');
    // One real hole on the event's own ruler: the marker density part is answered by the JS suite;
    // here the question is whether a finger that starts on a hole can move the real playhead.
    v.multiCameraPlayer.pauseAll();
    const total = v.continuousPlayer.getTotalDuration() || vc.totalDuration || 60;
    vc.setTotalDuration(total);
    const holeAt = total * 0.35;
    vc.addGapMarkers({
        segmentGaps: [6],
        segmentStartTimes: [0],
        segmentDurations: [holeAt],
    });
    vc.showControls();
    vc.resetHideTimer();
    const bar = vc.progressContainer;
    const r = bar.getBoundingClientRect();
    const majors = [...bar.querySelectorAll('.gap-marker:not(.minor)')];
    // a hole near one third of the bar, and a release point two thirds along
    const tick = majors.find((m) => {
        const b = m.getBoundingClientRect();
        return b.left > r.left + r.width * 0.28 && b.left < r.left + r.width * 0.42;
    }) || majors[0];
    const tb = tick.getBoundingClientRect();
    const cards = [...document.querySelectorAll('#fileList .video-card')].slice(0, 4).map((card) => {
        const b = card.getBoundingClientRect();
        return { id: card.dataset.eventId, cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
    });
    return JSON.stringify({
        dpr: window.devicePixelRatio,
        bar: { x: r.left, y: r.top, w: r.width, h: r.height },
        from: { x: tb.left + tb.width / 2, y: r.top + r.height / 2 },
        to: { x: r.left + r.width * 0.66, y: r.top + r.height / 2 },
        valueNow: Number(bar.getAttribute('aria-valuenow')),
        overlayShown: vc.overlay.classList.contains('show'),
        majors: majors.length,
        cards,
        drawerOpen: !v.dom.sidebar.classList.contains('collapsed'),
        current: v.currentEvent && v.currentEvent.eventId,
    });
})()

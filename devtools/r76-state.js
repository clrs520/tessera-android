// R76 setup read: orientation, ledger presence, and what the app can currently see.
(() => {
    const v = window.viewer;
    if (!v) return 'NO viewer';
    const mcp = v.multiCameraPlayer, cp = v.continuousPlayer;
    return JSON.stringify({
        w: innerWidth, h: innerHeight, dpr: devicePixelRatio,
        touch: isTouchShellRuntime(),
        events: (v.lastFilteredEvents || []).length,
        current: v.currentEvent ? v.currentEvent.eventId : null,
        segs: v.currentEvent ? v.currentEvent.segments.length : 0,
        // Nothing is played until an event is opened, and `continuousPlayer` may not exist yet, so the
        // read has to survive that — a throw here looks like "the ledgers are missing".
        idx: cp ? cp.currentSegmentIndex : null, playing: cp ? cp.isPlaying : null,
        layout: mcp.layoutMode, vis: mcp.visibleCameras().length,
        ledgers: [typeof mcp.describeLoss, typeof mcp.describeHolds,
            cp && typeof cp.describeAxis, Array.isArray(mcp.lossLog),
            cp && Array.isArray(cp.axisLog)].join(','),
        ver: (document.getElementById('appVersion') || {}).textContent || '-'
    });
})()

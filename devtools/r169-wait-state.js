(async () => {
    const v = window.viewer;
    const target = window.__r169target;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
        if (v.currentEvent && v.currentEvent.eventId === target) break;
        await new Promise((r) => setTimeout(r, 120));
    }
    return JSON.stringify({
        current: v.currentEvent && v.currentEvent.eventId,
        target,
        ms: Date.now() - t0,
        scanning: !!v.isScanning,
    });
})()

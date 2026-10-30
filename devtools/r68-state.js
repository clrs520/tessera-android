(() => {
    const t = document.getElementById('metadataPanel');
    const b = t ? t.getBoundingClientRect() : null;
    return {
        v: window.APP_VERSION,
        w: innerWidth, h: innerHeight, dpr: devicePixelRatio,
        viewer: typeof window.viewer,
        ev: viewer && viewer.currentEvent ? viewer.currentEvent.eventId : null,
        segs: viewer && viewer.currentEvent ? viewer.currentEvent.segments.length : 0,
        panel: b ? [Math.round(b.width), Math.round(b.height), Math.round(b.left), Math.round(b.top)] : null,
        cls: t ? t.className : null,
        inline: t ? t.getAttribute('style') : null,
        events: (viewer && viewer.events ? viewer.events.length : -1),
        firstEvent: viewer && viewer.events && viewer.events[0] ? viewer.events[0].eventId : null,
    };
})()

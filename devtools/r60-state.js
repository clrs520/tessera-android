(() => { try {
    const v = viewer, c = document.querySelector('.video-container');
    const lm = (v.videoControls && v.videoControls.layoutMode) || v.layoutMode || (c && c.parentElement && c.parentElement.className);
    const fd = document.querySelector('.feed-overlay, .feed-scroll, .feed-area');
    return JSON.stringify({
        ev: v.currentEvent && v.currentEvent.eventId,
        playing: !!(v.currentEvent && (v.continuousPlayer ? v.continuousPlayer.isPlaying : v.isPlaying)),
        cam: c && c.dataset.camera,
        lm: lm,
        zoom: c && c.style.getPropertyValue('--feed-zoom'),
        brightness: (() => { const b = document.querySelector('.brightness-overlay, .screen-brightness'); return b ? (b.style.opacity || b.className) : (document.documentElement.style.filter || 'none'); })(),
        speed: v.playbackRate || v.currentPlaybackRate || (v.videoControls && v.videoControls.playbackRate),
        filt: v.lastFilteredEvents && v.lastFilteredEvents.length,
    });
} catch (e) { return 'THREW ' + e.message; } })()

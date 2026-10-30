(() => {
    const v = window.viewer;
    const lc = v.videoListComponent;
    const cards = [...document.querySelectorAll('#fileList .video-card')];
    const thumbs = cards.map(c => c.querySelector('.video-thumbnail'));
    return JSON.stringify({
        thumbObserverType: lc.thumbObserver === undefined ? 'undefined' : (lc.thumbObserver === null ? 'null' : lc.thumbObserver.constructor.name),
        observed: lc.thumbObserver ? 'present' : String(lc.thumbObserver),
        framePaths: thumbs.map(t => t ? (t.dataset.framePath || null) : 'no-thumb-el'),
        firstEventFiles: (() => {
            const e = v.currentEvent || (v.allFiles && null);
            return e ? e.id : null;
        })(),
        events: (v.videoListComponent && v.videoListComponent.events) ? v.videoListComponent.events.length : null,
        groups: v.eventGroups ? v.eventGroups.length : null,
        firstGroupSegments: v.eventGroups ? v.eventGroups[0].segments.length : null,
        firstSegFileKeys: v.eventGroups ? Object.keys(v.eventGroups[0].segments[0].files) : null,
        firstPath: v.eventGroups ? (v.eventGroups[0].segments[0].files.front || Object.values(v.eventGroups[0].segments[0].files)[0]).path : null,
        isAndroid: typeof window.__TAURI_INTERNALS__ !== 'undefined',
        visible: thumbs.map(t => t ? t.getBoundingClientRect().top : null),
        viewportH: innerHeight,
        cache: FrameFetcher.cache.size,
        imgCount: document.querySelectorAll('#fileList .video-thumbnail img').length,
    });
})()

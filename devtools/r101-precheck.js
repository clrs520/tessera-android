// R101 precheck: the re-run of r100-verify reports a single-view picture 741 px tall where R100
// measured 267. Either the fix regressed or this instance is playing different media. Ask the
// player what it is actually decoding — intrinsic size and rotation only, never a URL or a path.
(async () => {
    const v = window.viewer;
    const p = document.querySelector('#front-player');
    const cell = document.querySelector('#front-container');
    const cs = cell ? getComputedStyle(cell) : null;
    const vid = cell ? cell.querySelector('video') : null;
    return {
        orient: `${innerWidth}x${innerHeight}`,
        playing: !!(v && v.currentEvent),
        eventLabel: (document.getElementById('headerEventName') || {}).textContent || null,
        intrinsic: p ? `${p.videoWidth}x${p.videoHeight}` : null,
        rotation: p && 'rotation' in p ? p.rotation : 'no-rotation-api',
        readyState: p ? p.readyState : null,
        srcState: p && p.currentSrc ? 'has-src' : 'no-src',
        cellBox: cs ? `${cs.width} x ${cs.height}` : null,
        objectFit: vid ? getComputedStyle(vid).objectFit : null,
        // Which folder is loaded, as a bare leaf name — enough to tell the real sample set from an
        // R86/R91 rotated fixture without printing a path.
        folderLeaf: (v && v.currentFolder ? String(v.currentFolder).split(/[\\/]/).pop() : null),
        eventCount: (v.eventGroups || []).length,
        firstEventCameras: (() => {
            const ev = (v.eventGroups || [])[0];
            return ev ? Object.keys(ev.filesByCamera || ev.cameras || {}).length : 0;
        })(),
    };
})()

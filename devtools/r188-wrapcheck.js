(() => {
    const v = window.viewer;
    const c = v.videoListComponent;
    const before = c.__r188Log ? c.__r188Log.length : null;
    const src = String(c.placeWindow).slice(0, 80);
    c.placeWindow(0);
    const after = c.__r188Log ? c.__r188Log.slice(-3) : null;
    return JSON.stringify({
        sameViewer: v === window.viewer,
        wrappedPlace: src.includes('r188Log'),
        srcHead: src,
        wrappedRestore: String(v.restoreListAnchor).slice(0, 80).includes('r188Log'),
        before, after,
    });
})()

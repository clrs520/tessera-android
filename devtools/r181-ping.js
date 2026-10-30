JSON.stringify((() => {
    const v = window.viewer;
    if (!v) return { noViewer: true };
    const l = v.videoListComponent;
    const list = v.dom.fileList;
    return { ver: window.__diagVersion || (v.nativeVersion || '?'),
        events: v.eventGroups ? v.eventGroups.length : -1,
        rows: list ? list.querySelectorAll('.video-card').length : -1,
        shown: l && l.listShown, listTop: l && l.listTop,
        windowed: l && l.listWindowed(), dir: v.currentSourcePath || v.lastSourcePath || null };
})());

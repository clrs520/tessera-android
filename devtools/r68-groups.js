(() => {
    const g = window.viewer.eventGroups || [];
    return g.map(e => ({
        id: e.eventId,
        segs: e.segments ? e.segments.length : 0,
        name: (e.folderName || e.name || '').slice(0, 40),
    }));
})()

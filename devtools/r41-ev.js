(() => {
    const v = window.viewer;
    const g = (v.eventGroups || []).map(e => ({
        id: e.id,
        segs: e.segments?.length,
        front: e.segments?.[0]?.files?.front?.name || null,
        frontPath: e.segments?.[0]?.files?.front?.path || null,
        dur: e.totalDuration,
    }));
    return JSON.stringify({ cur: v.currentEvent ? (v.currentEvent.id || 'obj') : null, groups: g }, null, 1);
})()

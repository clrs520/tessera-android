(async () => {
    const i = Math.max(0, viewer.eventGroups.findIndex(g => String(g.eventId).includes('2026-09-29_12-30-00')));
    const group = viewer.eventGroups[i];
    await viewer.playEvent(group);
    await new Promise(r => setTimeout(r, 2500));
    return JSON.stringify({
        i,
        id: group.eventId,
        segKeys: Object.keys(group.segments[0] || {}),
        cams: group.segments.map(s => s.camera || s.name || s.label),
        vids: Array.from(document.querySelectorAll('video')).map(v => ({ id: v.id, dur: Math.round(v.duration * 10) / 10 }))
    });
})()

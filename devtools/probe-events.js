(() => {
    const out = [];
    (viewer.eventGroups || []).forEach((g, gi) => {
        (g.events || []).forEach((e, i) => {
            const n = e.segments ? e.segments.length : 0;
            if (n > 1) out.push({ gi, i, id: String(e.id).slice(-16), segs: n });
        });
    });
    return { groups: (viewer.eventGroups||[]).length, multi: out.slice(0, 12), count: out.length,
             cur: viewer.currentEvent ? String(viewer.currentEvent.id).slice(-16) : null,
             curSegs: viewer.currentEvent && viewer.currentEvent.segments ? viewer.currentEvent.segments.length : 0 };
})()

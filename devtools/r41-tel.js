(async () => {
    const v = window.viewer;
    const out = [];
    for (let i = 0; i < v.eventGroups.length; i++) {
        const ev = v.eventGroups[i];
        try {
            await v.loadSpeedGraphForEvent(ev);
        } catch (e) { out.push({ i, err: String(e).slice(0, 80) }); continue; }
        out.push({ i, id: ev.id, span: v.videoControls.speedGraphSpan, cls: v.videoControls.speedGraphContainer.className });
    }
    return JSON.stringify(out, null, 1);
})()

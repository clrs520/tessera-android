// R101 precheck 2: which event is loaded, and which events are real multi-camera dashcam
// recordings? The 「最近片段」 pseudo-event pulls whatever was exported last, and a portrait
// export reshapes every geometry number downstream. Report titles + camera counts only.
(async () => {
    const v = window.viewer;
    const p = document.querySelector('#front-player');
    const shape = (v.eventGroups || []).map((ev, i) => {
        const files = ev.filesByCamera || ev.groups || ev.clipsByCamera || null;
        const cams = files ? Object.keys(files) : [];
        return { i, id: String(ev.eventId || '').slice(-18), title: ev.title || ev.label || null,
            cams: cams.length, keys: Object.keys(ev).join(','),
            // Whether this event's front clip is landscape, decided by the file name's camera tag
            // only — no path is returned.
            first: cams.length ? cams.slice(0, 6).join('/') : null };
    });
    return { count: (v.eventGroups || []).length,
        currentTail: String((v.currentEvent && v.currentEvent.eventId) || '').slice(-18),
        currentTitle: (v.currentEvent && (v.currentEvent.title || v.currentEvent.label)) || null,
        intrinsic: p ? `${p.videoWidth}x${p.videoHeight}` : null,
        shape: shape.slice(0, 12) };
})()

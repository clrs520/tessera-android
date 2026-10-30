(() => {
    const cp = viewer.continuousPlayer;
    const keys = Object.keys(cp);
    const out = { keys };
    for (const k of keys) {
        const v = cp[k];
        if (v === null || ['number','string','boolean','undefined'].includes(typeof v)) out[k] = typeof v === 'number' ? +v.toFixed(2) : v;
        else if (Array.isArray(v)) out[k] = 'Array(' + v.length + ')';
        else if (v instanceof Set) out[k] = 'Set(' + v.size + ')';
        else out[k] = v.constructor ? v.constructor.name : typeof v;
    }
    out._currentEventId = viewer.currentEventId;
    out._selectedEventId = viewer.selectedEvent && (viewer.selectedEvent.eventId || viewer.selectedEvent.id);
    out._eventListLen = viewer.eventGroups ? viewer.eventGroups.length : null;
    return JSON.stringify(out, null, 1);
})()

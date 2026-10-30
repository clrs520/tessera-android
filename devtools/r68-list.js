(() => {
    const v = window.viewer;
    const keys = Object.keys(v).filter(k => {
        const val = v[k];
        return Array.isArray(val) ? true : (val && typeof val === 'object' && Array.isArray(val.events));
    });
    const out = {};
    for (const k of keys) out[k] = Array.isArray(v[k]) ? v[k].length : (v[k].events ? v[k].events.length : '?');
    const evs = v.events || (v.eventBrowser && v.eventBrowser.events) || null;
    return {
        keys: out,
        hasEvents: !!evs,
        n: evs ? evs.length : 0,
        sample: evs && evs[0] ? { id: evs[0].eventId, segs: evs[0].segments.length } : null,
        folder: v.currentFolder || v.selectedFolder || null,
    };
})()

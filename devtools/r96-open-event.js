// open the first event and wait for a real plan — r88-ui assumes the export page has metadata to show
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 40 && !(v.eventGroups || []).length; i += 1) await sleep(500);
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    const p = v.phoneExportPlan();
    return JSON.stringify({ event: String(ev.eventId).split('/').pop(), dur: v.videoControls.totalDuration,
        planError: p.error || null, cells: p.views ? p.views.length : p.cells });
})();

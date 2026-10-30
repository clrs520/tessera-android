(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    await v.loadTauriDirectory('/sdcard/TeslaCamScroll');
    await s(1500);
    if (v.dom.sidebar.getBoundingClientRect().left < -1) { v.toggleSidebar(true); await s(500); }
    v.setSelectionMode(true);
    await s(400);
    const ids = [v.lastFilteredEvents[0].eventId, v.lastFilteredEvents[1].eventId];
    ids.forEach((id) => v.toggleEventSelection(id));
    await s(200);
    v.openBatchDeleteConfirm();
    await s(300);
    const j = v.pendingDelete;
    return JSON.stringify({
        selected: [...v.selection].length,
        items: (j.items || []).map((i) => ({ ev: i.event && i.event.eventId, t: i.targets && i.targets.length })),
        targets: (j.targets || []).length,
        title: document.getElementById('deleteConfirmTitle').textContent,
        summary: document.getElementById('deleteConfirmSummary').textContent,
    });
})()

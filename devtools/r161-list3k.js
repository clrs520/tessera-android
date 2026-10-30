// R161 — the list half of "3 000 events": scan+sidecars+first cards, then the passes a user runs
// on it (search, type filter, sort, paging). No playback: the clips are placeholders.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const time = async (fn) => { const t = performance.now(); const value = await fn(); return [Math.round(performance.now() - t), value]; };
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  const [loadMs] = await time(() => v.loadTauriDirectory('/storage/emulated/0/TeslaCam3k'));
  const groups = v.eventGroups.length;
  const cards = () => document.querySelectorAll('.video-card[data-event-id]').length;

  const [searchMs, searchCount] = await time(() => {
    v.dom.eventSearch.value = 'City 3000';
    v.filterAndRender();
    return v.lastFilteredEvents.length;
  });
  v.dom.eventSearch.value = '';

  const [typeMs, typeCount] = await time(() => {
    v.dom.eventFilter.value = 'SavedClips';
    v.filterAndRender();
    return v.lastFilteredEvents.length;
  });
  v.dom.eventFilter.value = '';

  const [sortMs, sortFirst] = await time(() => {
    v.toggleSortOrder();
    return v.lastFilteredEvents[0]?.startTime || null;
  });
  v.toggleSortOrder();
  await sleep(0);

  const [pagingMs, paged] = await time(() => {
    for (let i = 0; i < 10; i++) v.videoListComponent.appendListPage();
    return cards();
  });

  v.filterAndRender();
  return JSON.stringify({
    loadMs,
    events: groups,
    firstCards: cards(),
    searchMs,
    searchCount,
    typeMs,
    typeCount,
    sortMs,
    sortFirst,
    pagingMs,
    pagedCards: paged,
    dateChips: v.dom.dateChips.children.length,
    sidecars: v.lastSidecarSource,
    failures: v.sidecarFailures,
  });
})()

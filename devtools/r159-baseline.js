// Put the app on the real landscape TeslaCam event before the R102 suite, so its four baseline
// checks ("single view is landscape", card coverage, lens threshold) measure the right picture.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  v.setRecentSplit('none');
  v.setGapMarkMode('all');
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 120 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-08_07-41-59/.test(g.eventId));
  if (!ev) return JSON.stringify({ err: 'event missing', ids: (v.eventGroups || []).map(g => g.eventId) });
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 120 && !(v.currentEvent && v.videoControls.totalDuration > 0); i++) await sleep(250);
  for (let i = 0; i < 120; i++) {
    const vid = document.querySelector('.video-container video');
    if (vid && vid.videoWidth > 0) break;
    await sleep(250);
  }
  const vid = document.querySelector('.video-container video');
  return JSON.stringify({
    eventId: v.currentEvent && v.currentEvent.eventId,
    total: v.videoControls.totalDuration,
    video: vid ? `${vid.videoWidth}x${vid.videoHeight}` : null,
    view: v.currentView || null,
    split: v.recentSplit(),
    gap: v.gapMarkMode(),
  });
})()

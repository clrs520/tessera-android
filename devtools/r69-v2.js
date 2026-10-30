// The three lifecycle fixes shipped in 1.2.102, measured on the device rather than read in source.
(async () => {
  const out = {};
  const modal = viewer.peDom.modal;
  const vis = () => ({ display: modal.style.display, shown: modal.classList.contains('show') });

  // V1 — close and reopen inside the 300 ms hand-off. The old timer blanked the sheet
  // unconditionally, so a reopen that landed in that window left a panel open to the eye but with
  // `display:none` fighting it, and the back gesture still thought it was there.
  viewer.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 50));
  viewer.hidePhoneExportModal();
  const closed = vis();
  viewer.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 450));
  out.v1 = { closed, reopenedAfterTimer: vis(), pass: modal.classList.contains('show') && modal.style.display !== 'none' };
  viewer.hidePhoneExportModal();
  await new Promise(r => setTimeout(r, 400));
  out.v1Settled = vis();

  // V2 — two loads in a row without awaiting: the earlier continuation must not get the last word.
  const a = 'TeslaCam/SavedClips/2026-10-08_07-41-59';
  const b = 'TeslaCam/SentryClips/2026-10-07_03-12-00';
  const p1 = viewer.playEvent(a);
  const p2 = viewer.playEvent(b);
  await Promise.all([p1, p2]);
  await new Promise(r => setTimeout(r, 1200));
  const front = viewer.multiCameraPlayer.players.front;
  out.v2 = {
    currentEvent: viewer.currentEvent && viewer.currentEvent.eventId,
    askedFor: b,
    frontSrc: (front && front.src || '').split('/').slice(-2).join('/'),
    loadedFrontFile: viewer.continuousPlayer.currentSegment
        && viewer.continuousPlayer.currentSegment.files
        && (viewer.continuousPlayer.currentSegment.files.front || {}).name,
    pass: viewer.currentEvent && viewer.currentEvent.eventId === b
  };

  return JSON.stringify(out);
})()

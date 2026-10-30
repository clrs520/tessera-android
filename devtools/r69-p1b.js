// V1 done properly: the toast reader in r69-p1 pointed at #toast, which is not the element
// showToast writes to (.toast-container), so a blank there proved nothing.
(async () => {
  const r = { viewer: !!window.viewer };
  const toasts = () => Array.from(document.querySelectorAll('.toast-container')).map(c => c.textContent.trim());
  const settle = ms => new Promise(res => setTimeout(res, ms));

  const goodPath = viewer.lastScannedPath;
  const nBefore = viewer.eventGroups.length;

  // baseline: prove the reader sees the success sentence when the scan really does work
  document.querySelectorAll('.toast-container').forEach(c => c.remove());
  await viewer.rescanCurrentFolder();
  await settle(400);
  r.baselineToasts = toasts();

  // now the same entry point against a folder that is not on the device
  viewer.lastScannedPath = '/storage/emulated/0/TeslaCam/_definitely_not_here';
  document.querySelectorAll('.toast-container').forEach(c => c.remove());
  await viewer.rescanCurrentFolder();
  await settle(600);
  r.goneToasts = toasts();
  r.goneSaidFound = /个事件|events\b/i.test(r.goneToasts.join(' '));

  viewer.lastScannedPath = goodPath;
  await viewer.loadTauriDirectory(goodPath);
  r.restored = viewer.eventGroups.length === nBefore;
  return JSON.stringify(r, null, 1);
})()

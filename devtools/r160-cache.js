// R160 — switching the RecentClips view rebuilds the list from the same files; it must not pay for
// 3 000 sidecars again. The cache is per scan and is dropped when a new scan starts.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamMany');
  const time = async (fn) => { const t = performance.now(); await fn(); return Math.round(performance.now() - t); };
  const first = await time(() => v.setRecentSplit('day'));
  const firstSource = v.lastSidecarSource || null;
  const second = await time(() => v.setRecentSplit('none'));
  const secondSource = v.lastSidecarSource || null;
  const e = (v.eventGroups || [])[0];
  return JSON.stringify({
    events: (v.eventGroups || []).length,
    firstMs: first,
    firstSource,
    secondMs: second,
    secondSource,
    city: e && e.city,
    reason: e && e.reason,
    nativeReadCount: v.lastSidecarReadCount ?? null,
  });
})()

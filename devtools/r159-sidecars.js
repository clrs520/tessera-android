// R159 — the sidecar stage line ("读取事件信息 n/m") only exists for >24 events; watch every
// text write through a MutationObserver, then confirm the skeleton is gone afterwards.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  const obs = new MutationObserver(() => {
    const el = document.querySelector('.scan-skeleton-status');
    if (!el) return;
    const text = el.textContent;
    const log = window.__scanTexts || (window.__scanTexts = []);
    if (!log.length || log[log.length - 1] !== text) log.push(text);
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  window.__scanTexts = [];
  const t0 = performance.now();
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamSidecars');
  const elapsed = Math.round(performance.now() - t0);
  obs.disconnect();

  const texts = window.__scanTexts || [];
  out.sidecars = {
    elapsed,
    events: (v.eventGroups || []).length,
    files: (v.allFiles || []).length,
    stageTexts: texts.filter(t => /读取事件信息/.test(t)),
    scanTexts: texts.filter(t => /已扫描/.test(t)),
    all: texts,
    skeletonLeft: !!document.querySelector('.scan-skeleton'),
  };
  out.place = {
    firstCity: (v.eventGroups || [])[0]?.city,
    firstStreet: (v.eventGroups || [])[0]?.street,
  };
  return JSON.stringify(out);
})()

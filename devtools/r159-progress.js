// R159 — the native walk's counter and the sidecar stage must be visible while the bridge is
// still answering (a 1.9 TB stick used to look frozen).
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  const track = async (path) => {
    const samples = [];
    const started = performance.now();
    const timer = setInterval(() => {
      const el = document.querySelector('.scan-skeleton-status');
      samples.push({ t: Math.round(performance.now() - started), text: el ? el.textContent : null });
    }, 40);
    try {
      await v.loadTauriDirectory(path);
    } finally {
      clearInterval(timer);
    }
    const elapsed = Math.round(performance.now() - started);
    const seen = [];
    for (const s of samples) {
      if (!seen.length || seen[seen.length - 1].text !== s.text) seen.push(s);
    }
    return {
      elapsed,
      samples: samples.length,
      distinct: seen,
      events: (v.eventGroups || []).length,
      files: (v.allFiles || []).length,
      skeletonLeft: !!document.querySelector('.scan-skeleton'),
      statusLeft: !!document.querySelector('.scan-skeleton-status'),
    };
  };

  await track('/storage/emulated/0/TeslaCam');
  out.big = await track('/storage/emulated/0/TeslaCamBig');
  out.real = await track('/storage/emulated/0/TeslaCamReal');
  out.realSidecars = out.real.distinct.filter(s => /读取|Reading/.test(s.text || ''));
  out.bigCounted = out.big.distinct.filter(s => /扫描|Scanned/.test(s.text || ''));
  return JSON.stringify(out);
})()

(async () => {
  const v = window.viewer;
  const dead = '/storage/0000-0000/TeslaCam';
  const seen = [];
  const mo = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType === 1) seen.push({ cls: n.className, txt: (n.textContent || '').slice(0, 110) });
  })));
  mo.observe(document.body, { childList: true, subtree: true });
  let err = null;
  try { await v.nativeScanFiles(dead); } catch (e) { err = String(e && e.message || e).slice(0, 200); }
  let probe = null;
  try { probe = await window.viewer.constructor && await (async () => {
    const r = await (window.__nativeInvoke || (async () => null))();
    return r;
  })(); } catch (e) { probe = 'n/a'; }
  await new Promise(r => setTimeout(r, 300));
  mo.disconnect();
  const gone = document.querySelectorAll('#recentDirs .recent-chip');
  return JSON.stringify({ err, nativeToastHost: !!document.getElementById('toastContainer'),
    seen, chips: [...gone].map(c => c.dataset.path) }, null, 1);
})()

// R153 #21 · 同一 id 的同一种终态从两条路各来一次时，toast/震动/扫描只能各来一遍。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const toast = v.showToast.bind(v);
  const seen = [];
  v.showToast = (msg, ...rest) => { seen.push(String(msg)); return toast(msg, ...rest); };

  const id = 990001;
  v.peJob = { id, outPath: '', at: Date.now() };
  v.peTerminalSeen = null;
  const payload = { id, phase: 'error', code: 'generic', percent: 0, frames: 0, path: '', bytes: 0, message: 'x' };
  v.onPhoneExportProgress(payload);
  v.onPhoneExportProgress(payload);
  v.onPhoneExportProgress(payload);

  const afterSame = seen.slice();
  // A different job must still be reported — dedupe is per id:phase, not a latch.
  v.onPhoneExportProgress({ ...payload, id: id + 1 });
  const afterOther = seen.slice();

  v.showToast = toast;
  v.peTerminalSeen = null;
  const out = {
    sameIdToasts: afterSame.length,
    otherIdExtra: afterOther.length - afterSame.length,
    firstText: afterSame[0] || '',
    pass: afterSame.length === 1 && afterOther.length === 2,
  };
  return JSON.stringify(out);
})()

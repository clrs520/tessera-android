// R153 #12 · 启动导出并等终态，报告 payload 与 toast 文案（源文件由 shell 在这两步之间删除）。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  await v.startPhoneExport();
  const t = Date.now();
  while (Date.now() - t < 60000 && !window.__peTerm.length) await sleep(400);
  await sleep(500);
  const term = window.__peTerm[0] || null;
  return JSON.stringify({
    phase: term && term.phase, code: term && (term.code || ''), message: term && term.message,
    frames: term && term.frames, bytes: term && term.bytes, path: term && term.path,
    toasts: (window.__toasts || []).slice(-4),
    stillJob: !!v.peJob,
    jobId: v.peJob && v.peJob.id,
  }, null, 1);
})()

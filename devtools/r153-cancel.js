// R153 #11 · 取消路径两档：零帧取消（不该留下空壳、也不该承诺「保留」）与写出若干帧后取消。
// 注意：不能 await startPhoneExport() 之后再取消 —— AVD 上主线程被解码占住，这个 await 可能要几十秒，
// 取消会落在已经写了上百帧之后。这里 fire-and-forget，见到 peJob 立刻动手。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const out = { steps: [] };
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-09_12-00-00_gap/.test(g.eventId));
  if (!ev) return JSON.stringify({ harness: 'gap event missing' });
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 80 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);

  await v.showPhoneExportModal();
  await sleep(600);
  const vc = v.videoControls;
  vc.clipStartTime = 0;
  vc.clipEndTime = 6;
  v.peSelection.cameras = ['front'];
  for (const k of Object.keys(v.peSelection.overlay)) v.peSelection.overlay[k] = false;
  v.renderPhoneExportPanel();
  await sleep(400);

  window.__toasts = [];
  if (!v.__toastHook) {
    const orig = v.showToast.bind(v);
    v.showToast = (msg, ...rest) => { window.__toasts.push(String(msg)); return orig(msg, ...rest); };
    v.__toastHook = true;
  }
  window.__peTerm = [];
  window.__peStep = 0;
  if (!v.__peHook) {
    const orig = v.onPhoneExportProgress.bind(v);
    v.onPhoneExportProgress = (p) => {
      if (p && ['done', 'cancelled', 'error'].includes(p.phase)) window.__peTerm.push(p);
      else if (p && Number(p.step) > 0) window.__peStep = Number(p.step);
      return orig(p);
    };
    v.__peHook = true;
  }
  const status = () => new Promise((resolve) => {
    try { nativeAskJson('exportStatus').then(resolve); } catch (e) { resolve(null); }
  });
  const idle = async (ms) => {
    const t = Date.now();
    while (Date.now() - t < ms) {
      const s = await status();
      if (!v.peJob && s && !s.running) return true;
      await sleep(500);
    }
    return false;
  };

  out.historyBefore = (v.peExports || []).map(r => r.path);
  const planned = v.peOutPath(v.phoneExportPlan());
  out.planned = planned;

  const one = async (tag, waitStep) => {
    window.__peTerm = [];
    window.__toasts = [];
    window.__peStep = 0;
    // Fire and forget: the promise can take tens of seconds on this AVD.
    v.startPhoneExport();
    const t0 = Date.now();
    while (Date.now() - t0 < 30000 && !v.peJob && !window.__peTerm.length) await sleep(50);
    const startedAt = Date.now();
    if (!v.peJob) return { tag, started: false, terms: window.__peTerm };
    if (waitStep) {
      while (Date.now() - t0 < 120000 && window.__peStep < waitStep && !window.__peTerm.length) await sleep(100);
    } else {
      // Zero-frame: cancel before the 600 ms decoder warm-up can finish.
      await sleep(80);
    }
    v.cancelPhoneExport();
    const cancelledAt = Date.now();
    const want = v.peJob && v.peJob.id;
    const tWait = Date.now();
    while (Date.now() - tWait < 240000 && !window.__peTerm.some(p => p.id === want)) await sleep(500);
    const term = window.__peTerm.find(p => p.id === want) || null;
    await sleep(500);
    const s = await status();
    return {
      tag, started: true,
      msToStart: startedAt - t0, msHeldBeforeCancel: cancelledAt - startedAt,
      stepAtCancel: window.__peStep,
      phase: term && term.phase, code: term && term.code,
      frames: term && term.frames, bytes: term && term.bytes, path: term && term.path,
      toasts: (window.__toasts || []).slice(-4),
      job: !!v.peJob, running: s && s.running,
      history: (v.peExports || []).map(r => r.path),
    };
  };

  out.steps.push(await one('zero-frames', 0));
  await idle(120000);
  out.steps.push(await one('after-frames', 30));
  await idle(120000);

  const [early, late] = out.steps;
  const zero = early && early.phase === 'cancelled';
  const kept = late && late.phase === 'cancelled';
  out.verdict = {
    earlyStarted: !!(early && early.started),
    earlyZeroFrames: !!(early && early.frames === 0),
    earlyHuskDropped: !!(early && early.path === '' && early.bytes === 0),
    earlyNotInHistory: !!(early && !early.history.some(p => p === planned)),
    // The wording must match the payload: no 「已写入的片段」 over a cancel that wrote nothing.
    earlyWordingHonest: !!(early && early.toasts.some(t => /已取消/.test(t) && !/保存在文件里/.test(t))),
    lateStarted: !!(late && late.started),
    lateWroteFrames: !!(late && late.frames > 0),
    lateKeptSome: !!(late && late.bytes > 0 && !!late.path),
    lateInHistory: !!(late && late.history.some(p => /0\.0-6\.0s/.test(p))),
    lateKeptWording: !!(late && late.toasts.some(t => /保存在文件里/.test(t))),
    noJobLeft: !v.peJob,
  };
  out.pass = Object.values(out.verdict).every(Boolean);
  return JSON.stringify(out, null, 1);
})()

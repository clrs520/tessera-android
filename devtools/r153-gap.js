// R153 #22 · 中间一分钟缺文件的相机在导出里留洞（黑），而不是冻结上一段最后一帧。
// 现场：SavedClips/2026-10-09_12-00-00_gap，front 只有第 0、2 分钟，其余相机 0/1/2 都有。
// 实测轴：段长 [6.29, 60, 6.29]，front 的洞 = 6.29…66.29s。
// 导出 A：5–15s（front+back）——t 0.5 有画，t 8 / 9.5 是 front 的洞，back 全程有画。
// 导出 B：64–70s（单 front）——t 1 是洞，t 4 恢复有画（第二段从 66.29s 起）。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null, a: null, b: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-09_12-00-00_gap/.test(g.eventId));
  if (!ev) { out.harness = 'gap event missing'; return JSON.stringify(out); }
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 80 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);
  const vc = v.videoControls;
  out.total = vc.totalDuration;
  out.axis = { durations: ev.segmentDurations, starts: ev.segmentStartTimes };
  out.segments = { total: ev.segments.length, front: ev.segments.filter(s => s.files && s.files.front).length };
  if (!(vc.totalDuration > 70)) { out.harness = { totalDuration: vc.totalDuration }; return JSON.stringify(out); }

  await v.showPhoneExportModal();
  await sleep(600);
  const overlay = v.peSelection.overlay;
  for (const k of Object.keys(overlay)) overlay[k] = false;
  window.__peTerm = [];
  if (!v.__peHook) {
    const orig = v.onPhoneExportProgress.bind(v);
    v.onPhoneExportProgress = (p) => {
      if (p && ['done', 'cancelled', 'error'].includes(p.phase)) window.__peTerm.push(p);
      return orig(p);
    };
    v.__peHook = true;
  }

  const run = async (from, to, cameras) => {
    vc.clipStartTime = from;
    vc.clipEndTime = to;
    v.peSelection.cameras = cameras;
    v.renderPhoneExportPanel();
    await sleep(400);
    const plan = v.phoneExportPlan();
    if (plan.error) return { planError: plan.error };
    window.__peTerm = [];
    await v.startPhoneExport();
    const t = Date.now();
    while (Date.now() - t < 90000 && !window.__peTerm.length) await sleep(400);
    const term = window.__peTerm[0] || null;
    return {
      phase: term && term.phase, code: term && term.code, frames: term && term.frames,
      bytes: term && term.bytes, path: term && term.path,
      cams: plan.cameras.map(c => ({ camera: c.camera, cell: c.cell, segs: c.segments.length })),
      grid: { rows: plan.rows, cols: plan.cols },
    };
  };

  // Two views = 1 row × 2 cols, front is cell 0 (left half). Single view = whole frame.
  const luma = async (path, seconds) => {
    const url = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 20000);
      FrameFetcher.get(path, seconds, 640).then(value => { clearTimeout(timer); resolve(value); });
    });
    if (!url || !/^data:image/.test(url)) return null;
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const half = Math.floor(c.width / 2);
    const mean = (x0, w) => {
      const data = ctx.getImageData(x0, 0, w, c.height).data;
      let sum = 0, bright = 0;
      for (let i = 0; i < data.length; i += 4) {
        const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        sum += y;
        if (y > 40) bright++;
      }
      const px = data.length / 4;
      return { luma: +(sum / px).toFixed(1), bright: +(bright / px).toFixed(3) };
    };
    return { w: c.width, h: c.height, left: mean(0, half), right: mean(half, c.width - half), full: mean(0, c.width) };
  };

  const a = await run(5, 15, ['front', 'back']);
  out.a = a;
  if (a.phase === 'done' && a.path) {
    out.a.t = {};
    for (const s of [0.5, 8, 9.5]) out.a.t[s] = await luma(a.path, s);
  }

  const b = await run(64, 70, ['front']);
  out.b = b;
  if (b.phase === 'done' && b.path) {
    out.b.t = {};
    for (const s of [1, 4]) out.b.t[s] = await luma(b.path, s);
  }

  const blk = (cell) => !!cell && cell.luma < 8 && cell.bright < 0.005;
  const lit = (cell) => !!cell && cell.luma > 20 && cell.bright > 0.02;
  const A = out.a.t || {};
  const B = out.b.t || {};
  out.verdict = {
    aRealFront: lit(A['0.5'] && A['0.5'].left),
    aRealBack: lit(A['0.5'] && A['0.5'].right),
    aHoleFront8: blk(A['8'] && A['8'].left),
    aHoleFront9p5: blk(A['9.5'] && A['9.5'].left),
    aBackAlive8: lit(A['8'] && A['8'].right),
    aBackAlive9p5: lit(A['9.5'] && A['9.5'].right),
    bHoleAt1: blk(B['1'] && B['1'].full),
    bRealAt4: lit(B['4'] && B['4'].full),
  };
  out.pass = Object.values(out.verdict).every(Boolean);
  return JSON.stringify(out, null, 1);
})()

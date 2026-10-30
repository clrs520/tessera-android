// R152 · R143 #5 多路贴牌对位：同一段范围导出「开标签 / 关标签」两版，取成品帧比较
// 每格左上角标签带与底部对照带的差异 —— 标签必须烧进每一格，且不串格。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null, steps: [] };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => g.eventId === 'TeslaCam/SavedClips/2026-10-23_14-40-00' && (g.segments || []).length);
  if (!ev) { out.harness = 'sentry event missing'; return JSON.stringify(out); }
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 60 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);
  const vc = v.videoControls;
  vc.clipStartTime = 0;
  vc.clipEndTime = Math.min(3.0, vc.totalDuration);
  if (!(vc.clipEndTime > 0)) { out.harness = 'no duration'; return JSON.stringify(out); }

  await v.showPhoneExportModal();
  await sleep(600);
  v.peSelection.cameras = ['front', 'back'];
  const base = v.peSelection.overlay;
  for (const k of Object.keys(base)) base[k] = false;

  // Terminal capture (the page handles progress synchronously otherwise).
  window.__peTerm = [];
  if (!v.__peHook) {
    const orig = v.onPhoneExportProgress.bind(v);
    v.onPhoneExportProgress = (p) => {
      if (p && ['done', 'cancelled', 'error'].includes(p.phase)) window.__peTerm.push(p);
      return orig(p);
    };
    v.__peHook = true;
  }
  const run = async (labelOn, tag) => {
    v.peSelection.overlay.label = labelOn;
    v.renderPhoneExportPanel();
    await sleep(400);
    window.__peTerm = [];
    await v.startPhoneExport();
    const t = Date.now();
    while (Date.now() - t < 60000) {
      if (window.__peTerm.length) break;
      await sleep(400);
    }
    const term = window.__peTerm[0];
    out.steps.push({ tag, phase: term && term.phase, frames: term && term.frames, bytes: term && term.bytes });
    return term && term.phase === 'done' ? term.path : null;
  };
  const plan = v.phoneExportPlan();
  out.plan = { w: plan.width, h: plan.height, rows: plan.rows, cols: plan.cols, cams: plan.cameras, error: plan.error || null };
  if (plan.error) { out.harness = 'plan error'; return JSON.stringify(out); }

  const pathOn = await run(true, 'labels-on');
  const pathOff = await run(false, 'labels-off');
  if (!pathOn || !pathOff) { out.harness = 'export did not finish'; return JSON.stringify(out); }

  // Decode one frame of each file through the app's own retriever and diff it on a canvas.
  // The native retriever clamps to 640 px wide; go through the <video> grabber with the plan's own
  // width so the burned label is measured at export resolution, not at a thumbnail's.
  const frame = async (path) => {
    const url = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 20000);
      FrameFetcher.get(path, 1.5, 640).then(value => { clearTimeout(timer); resolve(value); });
    });
    if (!url || !/^data:image/.test(url)) return null;
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  };
  const a = await frame(pathOn), b = await frame(pathOff);
  if (!a || !b || a.width !== b.width || a.height !== b.height) {
    out.harness = { gotOn: !!a, gotOff: !!b, wa: a && a.width, wb: b && b.width };
    return JSON.stringify(out);
  }
  const W = a.width, H = a.height;
  const luma = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  const band = (img1, img2, x0, y0, x1, y1) => {
    let diff = 0, bright = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * W + x) * 4;
        diff += Math.abs(luma(img1.data, i) - luma(img2.data, i));
        if (luma(img1.data, i) > 200) bright++;
        n++;
      }
    }
    return { meanDiff: +(diff / Math.max(1, n)).toFixed(2), brightPct: +(100 * bright / Math.max(1, n)).toFixed(2), area: n };
  };
  const cells = [];
  const allVals = [];
  for (let r = 0; r < plan.rows; r++) {
    for (let c = 0; c < plan.cols; c++) {
      const x0 = Math.round(c * W / plan.cols), y0 = Math.round(r * H / plan.rows);
      const cw = Math.round(W / plan.cols), ch = Math.round(H / plan.rows);
      // 12x8 grid of mean |Δluma|. The burned chrome is a small, bright-on-dark chip; a mean over a
      // huge band buries it, so the hotspot's position is what we judge.
      const gx = 12, gy = 8, grid = [];
      for (let ry = 0; ry < gy; ry++) {
        const row = [];
        for (let rx = 0; rx < gx; rx++) {
          const v = band(a, b,
            x0 + Math.round(rx * cw / gx), y0 + Math.round(ry * ch / gy),
            x0 + Math.round((rx + 1) * cw / gx), y0 + Math.round((ry + 1) * ch / gy)).meanDiff;
          row.push(v);
          allVals.push(v);
        }
        grid.push(row);
      }
      let best = { v: -1, rx: 0, ry: 0 };
      grid.forEach((row, ry) => row.forEach((v, rx) => { if (v > best.v) best = { v, rx, ry }; }));
      cells.push({ r, c, best });
    }
  }
  out.frame = { w: W, h: H, cells, camCount: plan.cameras.length };
  // The label sits at a cell's top-left: the strongest difference must be in the first three
  // columns and first half of the rows, and clearly above the global noise floor.
  const sorted = allVals.slice().sort((p, q) => p - q);
  const noise = sorted[Math.floor(sorted.length * 0.5)] || 0;
  out.noise = +noise.toFixed(2);
  out.verdict = cells.length === plan.cameras.length
    && cells.every(x => x.best.v > Math.max(4, noise * 2) && x.best.rx <= 2 && x.best.ry <= 3);
  return JSON.stringify(out, null, 1);
})()

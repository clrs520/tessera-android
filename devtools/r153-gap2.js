// R153 #22 第二段：导出 A 已完成，跑 B（64–70s 单 front）并取两版成品帧判洞。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { a: null, b: null };
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const vc = v.videoControls;
  const doneA = (window.__peTerm || []).find(p => p.phase === 'done' && /5\.0-15\.0s/.test(p.path || ''));
  out.a = doneA ? { path: doneA.path, frames: doneA.frames } : null;
  if (!doneA) return JSON.stringify({ harness: 'export A not found', terms: (window.__peTerm || []).slice(-3) });

  vc.clipStartTime = 64;
  vc.clipEndTime = 70;
  v.peSelection.cameras = ['front'];
  v.renderPhoneExportPanel();
  await sleep(400);
  const plan = v.phoneExportPlan();
  out.planB = { error: plan.error || null, cams: plan.cameras.map(c => ({ camera: c.camera, segs: c.segments })), grid: { rows: plan.rows, cols: plan.cols } };
  if (plan.error) return JSON.stringify({ harness: 'plan error', out });

  window.__peTerm = [];
  await v.startPhoneExport();
  const t = Date.now();
  while (Date.now() - t < 240000 && !window.__peTerm.length) await sleep(1000);
  const term = window.__peTerm[0] || null;
  out.b = term && { phase: term.phase, code: term.code, frames: term.frames, bytes: term.bytes, path: term.path };
  if (!term || term.phase !== 'done') return JSON.stringify({ harness: 'B failed', out });

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

  out.a.t = {};
  for (const s of [0.5, 8, 9.5]) out.a.t[s] = await luma(doneA.path, s);
  out.b.t = {};
  for (const s of [1, 4]) out.b.t[s] = await luma(term.path, s);

  const blk = (cell) => !!cell && cell.luma < 8 && cell.bright < 0.005;
  const lit = (cell) => !!cell && cell.luma > 20 && cell.bright > 0.02;
  const A = out.a.t, B = out.b.t;
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

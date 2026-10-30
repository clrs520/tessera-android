// 上一版量到的 [345,192] 是**手指留下的旧角落**：`applyHudGeom()` 只在记住的位置合法时写属性，
// 从来不清属性，所以 hudState 清空后行内 `--hud-left/--hud-top` 还挂在那儿。
// 这条先 releaseHudTouchGeom() + 手动抹掉两个属性和 is-moved，才量得到 CSS 默认角落；
// 顺手把三种宫格都量一遍，并把「不压任何角标的可用 x 区间」算出来 —— 这是给下一轮定夺用的数，不是修改。
(() => {
  const mm = viewer.metadataManager;
  const out = window.__pill2 = { steps: [] };
  const rect = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const ov = (a, b) => (!a || !b || !a[2] || !b[2]) ? 0 : Math.round(Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])));
  const clear = () => {
    mm.releaseHudTouchGeom();
    mm.dom.panel.style.removeProperty('--hud-left');
    mm.dom.panel.style.removeProperty('--hud-top');
    mm.dom.panel.classList.remove('is-moved');
  };
  const one = tag => {
    const area = rect(mm.dom.playerArea);
    const labels = [...document.querySelectorAll('.camera-label')].map(l => ({ cam: l.textContent.trim(), r: rect(l) })).filter(l => l.r[2] > 0);
    const p = rect(mm.dom.panel);
    const hits = labels.filter(l => ov(p, l.r) > 0);
    // free bands = x 轴上塞得下 pill 宽度的、不压任何角标的区间（y 只在这一条带里才撞）
    const W = p[2];
    const inBand = labels.filter(l => l.r[1] < p[1] + p[3] && l.r[1] + l.r[3] > p[1]);
    const blocks = inBand.map(l => [l.r[0] - W, l.r[0] + l.r[2]]).sort((a, b) => a[0] - b[0]);
    const free = [];
    let cur = 0;
    for (const [s, e] of blocks) { if (s > cur) free.push([cur, Math.min(s, area[2] - W)]); cur = Math.max(cur, e); }
    if (cur < area[2] - W) free.push([cur, area[2] - W]);
    return {
      tag, folded: mm.hudFolded, area, panel: p, cls: mm.dom.panel.className,
      labels: labels.map(l => [l.cam, l.r]), covered: hits.map(h => h.cam),
      coveredPx: hits.map(h => [h.cam, ov(p, h.r)]), freeXBands: free
    };
  };
  const restore = { meta: mm.currentMetadata, loading: mm.isLoading, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud'), layout: document.querySelector('.player-area').className };
  (async () => {
    const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
    mm.currentMetadata = s0; mm.isLoading = false;
    mm.updateUIStatus(); mm.updateDisplay(5);
    localStorage.removeItem('tdashcam.metaHud'); mm.hudState = null;
    for (const lay of ['grid4', 'grid6', 'single']) {
      viewer.multiCameraPlayer.setLayout(lay);
      await new Promise(r => setTimeout(r, 350));
      for (const fold of [true, false]) {
        clear();
        mm.setHudFold(fold);
        out.steps.push(one(`${lay} ${fold ? 'pill' : 'card'}`));
      }
    }
    out.vw = innerWidth; out.vh = innerHeight; out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 400))
    .finally(() => {
      mm.currentMetadata = restore.meta; mm.isLoading = restore.loading;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      clear(); mm.updateUIStatus(); mm.syncHudFold();
      const m = restore.layout.match(/(\w+)-view/);
      if (m) viewer.multiCameraPlayer.setLayout(m[1] === 'grid4' ? 'grid4' : m[1]);
      out.restored = { meta: mm.currentMetadata.length, layout: document.querySelector('.player-area').className };
    });
  return 'armed: read window.__pill2';
})()

// 定 pill 默认落点之前还缺的一张图：画面**实际**占掉哪一块（16:9 装在多高的格子里），
// 角标贴在画面的什么位置，以及 pill 往下挪到哪儿能同时躲开所有档位的角标。
// 只量不改；三种宫格 × 折叠/展开，全在横屏手机档。
(() => {
  const mm = viewer.metadataManager;
  const out = window.__p11 = { rows: [] };
  const rect = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const rel = (r, base) => r && [r[0] - base[0], r[1] - base[1], r[2], r[3]];
  const clear = () => {
    mm.releaseHudTouchGeom();
    mm.dom.panel.style.removeProperty('--hud-left');
    mm.dom.panel.style.removeProperty('--hud-top');
    mm.dom.panel.classList.remove('is-moved');
  };
  const one = tag => {
    const base = rect(mm.dom.playerArea);
    const cells = [...document.querySelectorAll('.video-container')].map(c => {
      const v = c.querySelector('video');
      return { cam: (c.dataset.camera || (c.querySelector('.camera-label') || {}).textContent || '?').trim(),
        cell: rel(rect(c), base), vid: rel(rect(v), base),
        label: rel(rect(c.querySelector('.camera-label')), base) };
    }).filter(c => c.cell && c.cell[2] > 0);
    return { tag, area: base, pill: rel(rect(mm.dom.panel), base), cells };
  };
  const restore = { meta: mm.currentMetadata, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud'), layout: document.querySelector('.player-area').className };
  (async () => {
    const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
    mm.currentMetadata = s0; mm.isLoading = false;
    mm.updateUIStatus(); mm.updateDisplay(5);
    localStorage.removeItem('tdashcam.metaHud'); mm.hudState = null;
    for (const lay of ['grid4', 'grid6', 'single']) {
      viewer.multiCameraPlayer.setLayout(lay);
      await new Promise(r => setTimeout(r, 400));
      for (const fold of [true, false]) {
        clear(); mm.setHudFold(fold);
        out.rows.push(one(`${lay} ${fold ? 'pill' : 'card'}`));
      }
    }
    out.vw = innerWidth; out.vh = innerHeight; out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 400))
    .finally(() => {
      mm.currentMetadata = restore.meta; mm.isLoading = false;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      clear(); mm.updateUIStatus(); mm.syncHudFold();
      const m = restore.layout.match(/(\w+)-view/);
      if (m) viewer.multiCameraPlayer.setLayout(m[1]);
      out.restored = document.querySelector('.player-area').className;
    });
  return 'armed: read window.__p11';
})()

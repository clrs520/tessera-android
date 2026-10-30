// p11 的 grid6 那一栏是废的：setLayout('grid6') 不存在（六路档叫 'grid'），
// 所以六个容器全都没进栅格，量出来 915×2034。这条只补两件事：
//  1) 'grid'（六路 3×2）每格角标到底落在哪条 y 带上 —— 默认 top 要同时躲开两行角标；
//  2) 放大后那一角的「还原」按钮矩形 —— 46 这个数是给它留的，改了默认值要确认两件事不打架。
(() => {
  const mm = viewer.metadataManager;
  const out = window.__p12 = { rows: [] };
  const rect = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const rel = (r, base) => r && [r[0] - base[0], r[1] - base[1], r[2], r[3]];
  const clear = () => {
    mm.releaseHudTouchGeom();
    mm.dom.panel.style.removeProperty('--hud-left');
    mm.dom.panel.style.removeProperty('--hud-top');
    mm.dom.panel.classList.remove('is-moved');
  };
  const snap = tag => {
    const base = rect(mm.dom.playerArea);
    const cells = [...document.querySelectorAll('.video-container')].map(c => ({
      cam: (c.dataset.camera || '').trim(),
      cell: rel(rect(c), base),
      label: rel(rect(c.querySelector('.camera-label')), base)
    })).filter(c => c.cell && c.cell[2] > 0 && c.cell[3] < 900);
    return { tag, area: base, pill: rel(rect(mm.dom.panel), base), cells };
  };
  const restore = { meta: mm.currentMetadata, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud'), layout: document.querySelector('.player-area').className, zoom: document.body.classList.contains('camera-zoomed') };
  (async () => {
    const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
    mm.currentMetadata = s0; mm.isLoading = false;
    mm.updateUIStatus(); mm.updateDisplay(5);
    localStorage.removeItem('tdashcam.metaHud'); mm.hudState = null;
    for (const lay of ['grid', 'grid4', 'single', 'picture-in-picture']) {
      viewer.multiCameraPlayer.setLayout(lay);
      await new Promise(r => setTimeout(r, 400));
      for (const fold of [true, false]) {
        clear(); mm.setHudFold(fold);
        out.rows.push(snap(`${lay} ${fold ? 'pill' : 'card'}`));
      }
    }
    // 还原按钮：只有放大态才存在，量它是不是就压在默认角落上
    document.body.classList.add('camera-zoomed');
    clear(); mm.setHudFold(true);
    const zbtn = [...document.querySelectorAll('button')].filter(b => /还原|Reset/i.test(b.textContent) && b.offsetParent);
    out.resetButtons = zbtn.map(b => ({ txt: b.textContent.trim(), r: rel(rect(b), rect(mm.dom.playerArea)) }));
    out.zoomedPanelTop = rel(rect(mm.dom.panel), rect(mm.dom.playerArea));
    document.body.classList.remove('camera-zoomed');
    out.vw = innerWidth; out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 400))
    .finally(() => {
      mm.currentMetadata = restore.meta; mm.isLoading = false;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      clear(); mm.updateUIStatus(); mm.syncHudFold();
      const m = restore.layout.match(/(\w+)-view/);
      if (m) viewer.multiCameraPlayer.setLayout(m[1] === 'grid4-view' ? 'grid4' : m[1] === 'grid-view' ? 'grid' : m[1]);
      out.restored = document.querySelector('.player-area').className;
    });
  return 'armed: read window.__p12';
})()

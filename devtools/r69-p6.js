// 欠账 #1：横屏折叠 pill 的默认角落（left/top 8px）压住宫格第一格的「前视」角标。
// 这条不靠眼看 —— 把三组矩形一次量齐：pill（折叠态卡片）/ 每一格的相机角标 / ⋮ 那一坨头部区，
// 再量一遍展开态，看看「挪得动吗、往哪挪才不会撞到别的」。
// AVD 上的 fixture 没有 SEI，所以用 _r69probe 的合成片子（真带 SEI，60 条）临时喂进
// currentMetadata，让 hudHasNumbers() 为真 —— 这**不是**真数据驱动的那条渲染路径，
// 但 pill 的几何只取决于「有没有数字」，所以够用。量完一律还原。
(() => {
  const mm = viewer.metadataManager;
  const out = window.__pill = { steps: [] };
  const snap = tag => {
    const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
    const overlap = (a, b) => (!a || !b) ? null : Math.round(Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])));
    const pill = r(mm.dom.panel);
    const labels = [...document.querySelectorAll('.camera-label')].map(l => ({
      cam: l.dataset.camera || l.textContent.trim(), rect: r(l), under: (() => {
        const b = l.getBoundingClientRect();
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return top ? (top.closest('.metadata-panel, #metadataPanel') ? 'HUD' : (top.className || top.tagName)) : 'offscreen';
      })()
    }));
    return {
      tag, folded: mm.hudFolded, panelCls: mm.dom.panel ? mm.dom.panel.className : null,
      disp: mm.dom.panel ? getComputedStyle(mm.dom.panel).display : null,
      hasData: mm.dom.panel ? mm.dom.panel.classList.contains('has-data') : null,
      pillText: mm.dom.panel ? mm.dom.panel.textContent.replace(/\s+/g, ' ').trim().slice(0, 46) : null,
      panelRect: pill, labels, layout: viewer.currentLayout,
      overlapWithLabels: labels.map(l => ({ cam: l.cam, px: overlap(pill, l.rect) })),
      hudRect: r(mm.dom.hudContainer || document.querySelector('.playback-hud')),
      headerRight: r(document.querySelector('.header-right.active')) || r(document.getElementById('headerMenuBtn'))
    };
  };
  const restore = { meta: mm.currentMetadata, loading: mm.isLoading, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud') };
  (async () => {
    const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
    out.samples = s0.length;
    mm.currentMetadata = s0;
    mm.isLoading = false;
    localStorage.removeItem('tdashcam.metaHud');
    mm.hudState = null;
    // 走真路径：`.has-data` 是 updateUIStatus 挂上去的，横屏宫格靠它才 display 得出来；
    // 数字本身要 updateDisplay 跑一帧才落到 pill 上。
    mm.updateUIStatus();
    mm.updateDisplay(5);
    mm.syncHudFold();
    out.steps.push(snap('folded @ default corner'));
    mm.setHudFold(false);
    out.steps.push(snap('unfolded'));
    // 手指搬走之后的落点（如果默认角落确实撞了，这行给出「搬走能避开谁」的答案）
    mm.hudState = { left: 300, top: 8, folded: true };
    mm.syncHudFold();
    out.steps.push(snap('folded @ left=300'));
    out.vw = innerWidth; out.vh = innerHeight;
    out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 400))
    .finally(() => {
      mm.currentMetadata = restore.meta;
      mm.isLoading = restore.loading;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      mm.updateUIStatus();
      mm.syncHudFold();
      out.restored = { meta: mm.currentMetadata.length, stored: localStorage.getItem('tdashcam.metaHud') };
    });
  return 'armed: read window.__pill';
})()

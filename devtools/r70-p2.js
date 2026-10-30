// R70 post-install geometry check on the real 1.2.104 build — no injected CSS.
// Measures where the HUD lands at its DEFAULT corner (stored position cleared) in every landscape
// layout, folded and expanded, against the camera badges it used to cover.
(() => {
  const out = window.__r70g = { steps: [] };
  const mm = viewer.metadataManager;
  if (!mm || !mm.dom || !mm.dom.panel) { out.err = 'no metadataManager'; out.done = true; return 'failed' }
  const rect = el => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const ov = (a, b) => Math.round(Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])));
  const one = (lay, fold) => {
    const p = rect(mm.dom.panel);
    const labels = [...document.querySelectorAll('.camera-label')].map(rect).filter(r => r[2] > 0 && r[2] < 400);
    const hits = labels.map(r => ({ r, px: ov(p, r) })).filter(h => h.px > 0);
    return {
      lay, fold,
      foldedClass: mm.dom.panel.classList.contains('hud-folded'),
      cssTop: getComputedStyle(mm.dom.panel).top,
      inline: mm.dom.panel.getAttribute('style') || '',
      panel: p,
      labels: labels.length,
      labelBands: [...new Set(labels.map(r => r[1] + '..' + (r[1] + r[3])))],
      covered: hits.map(h => ({ badge: h.r, pctOfBadge: +(h.px / (h.r[2] * h.r[3]) * 100).toFixed(0) })),
    };
  };
  const restore = { meta: mm.currentMetadata, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud') };
  (async () => {
    // The gate is hudHasNumbers(), not the .has-data class: a SavedClips event with no telemetry
    // sidecar still paints a place name, gets .has-data, and then refuses to fold — so the pill
    // never appears and the measurement silently describes the wrong box.
    if (!mm.hudHasNumbers()) {
      const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
      if (!Array.isArray(s0) || !s0.length) { out.err = 'no telemetry, real or fixture'; out.done = true; return; }
      mm.currentMetadata = s0; mm.isLoading = false;
      mm.updateUIStatus(); mm.updateDisplay(5);
    }
    out.telemetry = mm.hudHasNumbers() ? 'numbers' : 'none';
    // Default corner only: a remembered drag writes --hud-top, which would mask the CSS default.
    localStorage.removeItem('tdashcam.metaHud'); mm.hudState = null;
    mm.releaseHudTouchGeom();
    mm.dom.panel.style.removeProperty('--hud-top');
    mm.dom.panel.style.removeProperty('--hud-left');
    mm.dom.panel.classList.remove('is-moved');
    for (const lay of ['grid', 'grid4', 'single', 'picture-in-picture']) {
      viewer.multiCameraPlayer.setLayout(lay);
      await new Promise(r => setTimeout(r, 450));
      for (const fold of [true, false]) {
        mm.setHudFold(fold);
        await new Promise(r => setTimeout(r, 150));
        out.steps.push(one(lay, fold));
      }
    }
    out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300))
    .finally(() => {
      mm.currentMetadata = restore.meta; mm.isLoading = false;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      mm.dom.panel.style.removeProperty('--hud-top');
      mm.dom.panel.style.removeProperty('--hud-left');
      mm.dom.panel.classList.remove('is-moved');
      mm.updateUIStatus(); mm.syncHudFold();
    });
  return 'armed: read window.__r70g';
})()

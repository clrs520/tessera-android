// Re-run the baseline export on this build: same range, same six cameras, both burn-ins on.
// Goes through the panel so the codec probes have answered — `phoneExportFit` reads a cache, and an
// empty cache means nothing to clamp against (the baseline's 1696x736 came from a warm one).
(function () {
  window.__r73x = { running: true };
  (async () => {
    const v = viewer;
    const cams = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
    const out = {};
    try {
      v.videoControls.clipModeActive = true;
      v.videoControls.clipStartTime = 0;
      v.videoControls.clipEndTime = 6;
      v.peSelection.cameras = cams.slice();
      v.peSelection.overlay.stamp = true;
      v.peSelection.overlay.hud = true;
      await v.showPhoneExportModal();
      for (let t = 0; t < 20; t++) {
        await new Promise(r => setTimeout(r, 500));
        const plan = v.phoneExportPlan();
        if (plan && !plan.error) out.cached = v.peCodecKindCache.size;
      }
      const plan = v.phoneExportPlan();
      out.size = `${plan.width}x${plan.height}`;
      out.cams = plan.cameras.length;
      out.durationUs = plan.durationUs;
      out.captions = (v.phoneExportCaptions() || []).length;
      out.captionAt3s = (v.phoneExportCaptions() || [])[3]?.text ?? null;
      out.codeCache = v.peCodecKindCache.size;
      v.startPhoneExport();
      await new Promise(r => setTimeout(r, 3000));
      out.job = v.peJob;
      out.percent = v.pePercent;
      out.progressText = (document.getElementById('peProgressText') || {}).textContent || null;
    } catch (e) {
      out.threw = String(e && e.stack || e);
    }
    out.running = false;
    window.__r73x = out;
  })();
  return 'armed';
})()

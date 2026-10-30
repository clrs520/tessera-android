(function () {
  const CAMS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
  const vc = viewer.videoControls;
  viewer.peSelection.cameras = CAMS.slice();
  viewer.peSelection.overlay.stamp = true;
  viewer.peSelection.overlay.hud = true;
  vc.clipStartTime = 0;
  vc.clipEndTime = 6;
  viewer.peCaptionKey = null;   // force a rebuild
  viewer.peTelemetryKey = null;
  const caps = viewer.phoneExportCaptions();
  const plan = viewer.phoneExportPlan();
  const pts = viewer.phoneExportTelemetry(viewer.currentEvent);
  return JSON.stringify({
    captions: caps.length,
    first: caps[0] ? caps[0].text : null,
    mid: caps[3] ? caps[3].text : null,
    last: caps[caps.length - 1] ? caps[caps.length - 1].text : null,
    usSteps: caps.map(c => c.us),
    telemetryPoints: pts.length,
    telemetrySpan: pts.length ? [pts[0].at, pts[pts.length - 1].at] : null,
    plan: { cameras: plan.cameras, rows: plan.rows, cols: plan.cols, w: plan.width, h: plan.height,
      durUs: plan.durationUs, error: plan.error || null },
  });
})()

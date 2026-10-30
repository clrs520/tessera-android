// Fixture smoke test: can the app's own read path (getFileUrl -> fetch -> DashcamMP4 -> protobuf)
// turn the three synthetic clips into a drawn curve? Run against whatever build is installed so the
// same probe reads differently before and after the R69 change.
(async () => {
  const dir = '/storage/emulated/0/TeslaCam/_r69probe';
  const mk = n => ({ path: `${dir}/${n}.mp4` });
  const ev = {
    eventId: 'r69-probe',
    segments: [{ files: { front: mk('seg0') } }, { files: { front: mk('seg1') } }, { files: { front: mk('seg2') } }],
    segmentDurations: [60, 60, 60],
    segmentStartTimes: [0, 60, 120]
  };
  const vc = viewer.videoControls;
  const draws = [];
  const real = vc.drawSpeedGraph.bind(vc);
  vc.drawSpeedGraph = (m, d) => { draws.push({ at: Math.round(performance.now() - t0), segs: m.length, pts: m.reduce((s, a) => s + a.length, 0) }); return real(m, d); };
  const t0 = performance.now();
  await viewer.loadSpeedGraphForEvent(ev);
  const ms = Math.round(performance.now() - t0);
  const out = {
    ms,
    draws,
    span: vc.speedGraphSpan,
    visible: vc.speedGraphContainer.classList.contains('visible'),
    samples: ev.telemetrySamples ? ev.telemetrySamples.length : -1,
    s0: ev.telemetrySamples && [ev.telemetrySamples[0].time, +ev.telemetrySamples[0].data.vehicleSpeedMps, ev.telemetrySamples[0].segmentStart],
    s60: ev.telemetrySamples && [ev.telemetrySamples[60].time, +ev.telemetrySamples[60].data.vehicleSpeedMps, ev.telemetrySamples[60].segmentStart],
    cacheKeys: [...MetadataManager.seiCache.keys()].map(k => k.split('/').pop()),
    // -2 means "the canvas has no backing store yet", which happens on the list screen: reading
    // getImageData at width 0 throws IndexSizeError and takes the whole probe down with it.
    canvasPainted: (() => { const c = vc.speedGraphCanvas; if (!c.width || !c.height) return -2; const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++; return n; })()
  };
  vc.drawSpeedGraph = real;
  return JSON.stringify(out);
})()

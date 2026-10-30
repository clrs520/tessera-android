// R159 — a segment the (budgeted) sweep never read must gain its curve the moment the data card
// reads it. Uses the SEI fixture event (150 points, 0–6.24 s) on the app fixture tree.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 120 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-09_09-00-00/.test(g.eventId));
  if (!ev) { out.harness = 'SEI fixture missing'; out.ids = (v.eventGroups || []).map(g => g.eventId); return JSON.stringify(out); }
  const cp = v.continuousPlayer;
  await cp.calculateEventDurations(ev);

  const idx = ev.segments.findIndex(s => s.files && s.files.front);
  const file = ev.segments[idx].files.front;
  v.currentEvent = ev;
  cp.currentSegmentIndex = idx;
  const vc = v.videoControls;

  const reset = () => {
    vc.lastSpeedGraphData = { metadata: ev.segments.map(() => []), durations: ev.segmentDurations.slice() };
    vc.speedGraphContainer.classList.remove('visible');
    vc.liveGraphPaintAt = 0;
  };
  const pixels = () => {
    const c = vc.speedGraphCanvas;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let lit = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit += 1;
    return lit;
  };

  out.before = { idx, segments: ev.segments.length, segStart: ev.segmentStartTimes[idx], clipStart: ev.segments[idx].clipStart || 0 };
  reset();
  out.before.visible = vc.speedGraphContainer.classList.contains('visible');

  const t0 = performance.now();
  await v.metadataManager.loadMetadata(file);
  const t1 = performance.now();
  const filled = vc.lastSpeedGraphData.metadata[idx];
  out.after = {
    ms: Math.round(t1 - t0),
    cardPoints: v.metadataManager.currentMetadata.length,
    filledPoints: filled.length,
    firstTime: filled.length ? +filled[0].time.toFixed(2) : null,
    lastTime: filled.length ? +filled[filled.length - 1].time.toFixed(2) : null,
    segmentStartOnSamples: filled.length ? filled[0].segmentStart : null,
    othersStillEmpty: vc.lastSpeedGraphData.metadata.filter((m, i) => i !== idx && !m.length).length,
    visible: vc.speedGraphContainer.classList.contains('visible'),
    span: vc.speedGraphSpan,
    litPixels: pixels(),
  };

  // The trimmed head of an overlapping clip: samples before clipStart describe the repeated part
  // and must be dropped, the rest shifted back onto the segment's own axis.
  ev.segments[idx].clipStart = 1.5;
  reset();
  await v.metadataManager.loadMetadata(file);
  const trimmed = vc.lastSpeedGraphData.metadata[idx];
  out.trimmed = {
    clipStart: 1.5,
    filledPoints: trimmed.length,
    firstTime: trimmed.length ? +trimmed[0].time.toFixed(2) : null,
    span: vc.speedGraphSpan,
    visible: vc.speedGraphContainer.classList.contains('visible'),
  };

  // A second read of the same segment must not double the samples.
  const before2 = trimmed.length;
  await v.metadataManager.loadMetadata(file);
  out.repeat = { before: before2, after: vc.lastSpeedGraphData.metadata[idx].length };
  ev.segments[idx].clipStart = 0;
  return JSON.stringify(out);
})()

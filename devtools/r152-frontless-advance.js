// R152 · R143 #4 正向半场：第一段没有 front 时，别的路的 ended 能不能把事件推进到第二段。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null, samples: [] };
  const TARGET = 'TeslaCam/SavedClips/2026-10-23_14-10-00';
  const ev = () => (v.eventGroups || []).find(g => g.eventId === TARGET);

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !ev(); i++) await sleep(250);
  const e = ev();
  if (!e) { out.harness = 'frontless event not scanned'; return JSON.stringify(out); }
  out.segments = (e.segments || []).length;
  out.seg0HasFront = !!(e.segments && e.segments[0] && e.segments[0].files && e.segments[0].files.front);

  await v.playEvent(e.eventId);
  // A short fixture ends fast; sample the segment index until it moves or the budget is spent.
  const t0 = Date.now();
  let advanced = false;
  for (let i = 0; i < 60; i++) {
    const cp = v.continuousPlayer;
    const idx = cp ? cp.currentSegmentIndex : undefined;
    out.samples.push({ ms: Date.now() - t0, seg: idx, playing: v.videoControls.isPlaying });
    if (typeof idx === 'number' && idx >= 1) { advanced = true; break; }
    await sleep(250);
  }
  out.advanced = advanced;
  out.final = { seg: v.continuousPlayer && v.continuousPlayer.currentSegmentIndex,
    playing: v.videoControls.isPlaying };
  return JSON.stringify(out);
})()

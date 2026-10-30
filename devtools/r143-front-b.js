(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const cp = v.continuousPlayer;
  const mcp = v.multiCameraPlayer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

  v.lastScanSignature = null;
  await v.loadTauriDirectory(v.lastScannedPath);
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
  if (!ev) return JSON.stringify({ error: 'no 3-segment event', counts: v.eventGroups.map(g => (g.segments || []).length) });
  const hasFront = ev.segments.map(s => !!(s.files && s.files.front));
  add('fixture-second-segment-lacks-front', hasFront[0] && hasFront[1] === false, hasFront);

  v.playEvent(ev);
  const t = Date.now();
  while (!v.currentEvent && Date.now() - t < 25000) await sleep(200);
  add('event-opened', !!v.currentEvent, { segs: hasFront.length });
  if (!v.currentEvent) return JSON.stringify({ checks });
  await sleep(2500);

  // ── 负向对照：front 在位时，别的路先播完不得提前换段 ──────────────────────────
  await cp.seekToTime(5);
  await sleep(1500);
  const segBefore = cp.currentSegmentIndex;
  mcp.players.back.dispatchEvent(new Event('ended'));
  await sleep(3000);
  add('other-feed-ending-first-does-not-advance', cp.currentSegmentIndex === segBefore,
      { segBefore, segAfter: cp.currentSegmentIndex, lacksFront: cp.segmentLacksFront() });

  // ── 正向：该段没有 front，别的路 ended 必须把这一段收掉 ────────────────────────
  // Ask the axis where segment 1 starts instead of assuming 60 s — R77 rebooks every clip to its
  // measured length, so a nominal second is often still inside the first one.
  const d0 = (cp.segmentDurations && cp.segmentDurations[0]) || (cp.currentEvent && cp.currentEvent.segmentDurations || [])[0] || 60;
  const into = d0 + 3;
  await cp.seekToTime(into);
  const ts = Date.now();
  while (cp.currentSegmentIndex === segBefore && Date.now() - ts < 15000) await sleep(300);
  const atNoFront = cp.currentSegmentIndex;
  add('seeked-into-frontless-segment', cp.segmentLacksFront() === true,
      { into, atNoFront, lacksFront: cp.segmentLacksFront() });
  mcp.players.back.dispatchEvent(new Event('ended'));
  const ta = Date.now();
  while (cp.currentSegmentIndex === atNoFront && Date.now() - ta < 12000) await sleep(300);
  add('frontless-segment-stall-is-advanced', cp.currentSegmentIndex > atNoFront,
      { before: atNoFront, after: cp.currentSegmentIndex });

  return JSON.stringify({ total: checks.length, failed: checks.filter(c => !c.pass).length, checks }, null, 1);
})()

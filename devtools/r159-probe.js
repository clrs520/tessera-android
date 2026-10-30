// R159 — with the scan unable to read a clip's moov, one native call must recover the exact
// durations, and the ruler (starts/gaps) must come out identical to the measured scan.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null, before: null, after: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }
  const cp = v.continuousPlayer;

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamReal');
  for (let i = 0; i < 120 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-08_07-41-59/.test(g.eventId));
  if (!ev) { out.harness = 'real event missing'; return JSON.stringify(out); }

  await cp.calculateEventDurations(ev);
  out.before = {
    segments: ev.segments.length,
    durations: (ev.segmentDurations || []).map(d => +d.toFixed(3)),
    starts: (ev.segmentStartTimes || []).map(d => +d.toFixed(3)),
    gaps: (ev.segmentGaps || []).map(d => +d.toFixed(3)),
    total: +ev.totalDuration.toFixed(3),
  };

  for (const s of ev.segments) s.duration = undefined;
  const t0 = performance.now();
  const learned = await cp.probeUnmeasuredClips(ev);
  const t1 = performance.now();
  const raw = ev.segments.map(s => s.duration === undefined ? null : +s.duration.toFixed(3));
  await cp.calculateEventDurations(ev);
  out.after = {
    learned,
    ms: Math.round(t1 - t0),
    raw,
    durations: (ev.segmentDurations || []).map(d => +d.toFixed(3)),
    starts: (ev.segmentStartTimes || []).map(d => +d.toFixed(3)),
    gaps: (ev.segmentGaps || []).map(d => +d.toFixed(3)),
    total: +ev.totalDuration.toFixed(3),
  };
  const same = (a, b) => a.length === b.length && a.every((x, i) => Math.abs(x - b[i]) < 0.002);
  out.identical = {
    durations: same(out.before.durations, out.after.durations),
    starts: same(out.before.starts, out.after.starts),
    gaps: same(out.before.gaps, out.after.gaps),
    total: Math.abs(out.before.total - out.after.total) < 0.002,
  };
  return JSON.stringify(out);
})()

// R161 — one event can hold more than 300 unmeasured clips (a day of RecentClips is 1 440).
// The lazy probe must cover all of them, not stop at the command's per-call batch size.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamProbe');
  for (let i = 0; i < 120 && (v.eventGroups || []).length !== 1; i++) await sleep(100);
  const ev = (v.eventGroups || [])[0];
  if (!ev) return JSON.stringify({ err: 'fixture missing' });
  const total = ev.segments.length;
  for (const seg of ev.segments) seg.duration = undefined;
  const t0 = performance.now();
  const learned = await v.continuousPlayer.probeUnmeasuredClips(ev);
  const ms = Math.round(performance.now() - t0);
  const filled = ev.segments.filter(seg => Number(seg.duration) > 0).length;
  return JSON.stringify({
    segments: total,
    learned,
    filled,
    missing: total - filled,
    ms,
    first: ev.segments[0]?.duration ?? null,
    last: ev.segments[total - 1]?.duration ?? null,
  });
})()

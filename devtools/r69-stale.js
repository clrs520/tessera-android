// The stale-curve half of the bug: while a slow segment read is in flight, what is on screen and
// what does a tap on it do? Event A is a fast synthetic clip; event B's only segment is the real
// 53 MB front file.
//
// Fire-and-forget with step marks rather than one awaited expression: the whole sequence can take
// longer than the CDP round trip, and a bare `await` version times out without saying where it got
// to. Read it back with `node devtools/cdp-eval.mjs "JSON.stringify(window.__stale)"`.
(() => {
  const dir = '/storage/emulated/0/TeslaCam/_r69probe';
  const vc = viewer.videoControls;
  const out = window.__stale = { steps: [], t0: Math.round(performance.now()) };
  const snap = tag => ({
    tag,
    visible: vc.speedGraphContainer.classList.contains('visible'),
    span: vc.speedGraphSpan,
    totalDuration: +Number(vc.totalDuration).toFixed(2),
    painted: (() => {
      const c = vc.speedGraphCanvas;
      // Reading getImageData at width 0 throws IndexSizeError and takes the probe down with it.
      if (!c.width || !c.height) return -2;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
      return n;
    })()
  });
  const step = (name, extra) => out.steps.push([name, Math.round(performance.now() - out.t0), extra]);

  const evA = {
    eventId: 'r69-A', segments: [{ files: { front: { path: `${dir}/seg0.mp4` } } }],
    segmentDurations: [60], segmentStartTimes: [0]
  };
  const big = viewer.eventGroups.find(g => g.eventId.includes('07-41-59')).segments[0].files.front;
  const evB = {
    eventId: 'r69-B', segments: [{ files: { front: big } }],
    segmentDurations: [18.27], segmentStartTimes: [0]
  };

  (async () => {
    step('begin');
    await viewer.loadSpeedGraphForEvent(evA);
    step('awaited A', snap('after A'));

    // Now put B's timeline up and start its read: between here and its completion, the screen is
    // the interesting part.
    vc.setTotalDuration(18.27);
    const slow = viewer.loadSpeedGraphForEvent(evB);
    step('B started');
    await new Promise(r => setTimeout(r, 400));
    const mid = snap('400ms into B');
    // A's curve peaks at its 59th of 60 seconds, i.e. x = 0.983 of the width. Where would a tap on
    // that peak send the playhead while B owns the timeline?
    mid.tapOnAsPeakWouldSeekTo = +(0.983 * vc.totalDuration).toFixed(2);
    mid.curveOnScreenIs = vc.speedGraphSpan ? `A (span ${vc.speedGraphSpan}s)` : 'none';
    step('mid', mid);
    await slow;
    step('awaited B', snap('after B'));
    out.bSamples = evB.telemetrySamples ? evB.telemetrySamples.length : -1;
    out.aSamples = evA.telemetrySamples ? evA.telemetrySamples.length : -1;
    out.done = Math.round(performance.now() - out.t0);
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300));
  return 'armed: read window.__stale';
})()

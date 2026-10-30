// R71 p4: the cross-midnight branch, tested the only way it can actually happen —
// the event starts seconds before midnight, so base+elapsed lands on the next day.
// Fixture is a SavedClips event, so updateRealTimeClock takes the fallback path
// (currentEventStartTime + continuousPlayer.getCurrentTime()); both are pinned so the
// crossing is deterministic instead of depending on wherever the playhead happens to be.
// Plus: does the live ticker keep the time-only format while playing?
(async () => {
  const out = {};
  const v = window.viewer, vc = v.videoControls, cp = v.continuousPlayer;
  const clk = document.getElementById('realTimeClock');
  if (!clk) { out.err = 'no clock'; return JSON.stringify(out); }
  if (document.querySelector('.player-area')?.classList.contains('empty')) { out.err = 'no event'; return JSON.stringify(out); }

  const base = vc.currentEventStartTime;
  if (!base) { out.err = 'no currentEventStartTime'; return JSON.stringify(out); }
  out.eventType = cp.currentEvent && cp.currentEvent.eventType;
  out.realElapsed = Math.round(cp.getCurrentTime ? cp.getCurrentTime() : -1);

  const wasOwn = Object.prototype.hasOwnProperty.call(cp, 'getCurrentTime');
  const realNow = cp.getCurrentTime;
  cp.getCurrentTime = function () { return 13; };   // 23:59:50 + 13s → next day 00:00:03

  const midnightEve = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 50);
  vc.currentEventStartTime = midnightEve;
  vc.updateRealTimeClock();
  out.night = clk.textContent.trim();
  out.nightHasDate = /^\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(out.night);

  // Same day again (still pinned at 13s in) → the date must drop back off.
  vc.currentEventStartTime = base;
  vc.updateRealTimeClock();
  out.day = clk.textContent.trim();
  out.dayHasNoDate = /^\d{2}:\d{2}:\d{2}$/.test(out.day);

  if (wasOwn) cp.getCurrentTime = realNow; else delete cp.getCurrentTime;

  // Live ticker: play, sample the string 6 times over ~3s, all must stay HH:MM:SS and advance.
  const samples = [];
  v.multiCameraPlayer.playAll?.();
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 500));
    samples.push(clk.textContent.trim());
  }
  v.multiCameraPlayer.pauseAll?.();
  out.samples = samples;
  out.allTimeOnly = samples.every(s => /^\d{2}:\d{2}:\d{2}$/.test(s));
  out.advancing = samples[0] !== samples[samples.length - 1];
  out.elapsedRestored = Math.round(cp.getCurrentTime());
  return JSON.stringify(out, null, 1);
})()

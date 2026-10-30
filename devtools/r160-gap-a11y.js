// R160 — a major gap must explain itself to a screen reader too: TalkBack performs a click, not a
// 450 ms press. The minor ticks must stay decoration and must not start swallowing the scrub bar.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamGap');
  for (let i = 0; i < 120 && !(v.eventGroups || []).length; i++) await sleep(100);
  const ev = (v.eventGroups || [])[0];
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 120 && !(v.videoControls.totalDuration > 0); i++) await sleep(100);
  v.setGapMarkMode('all');
  v.videoControls.addGapMarkers(ev);
  const majors = [...document.querySelectorAll('.gap-marker:not(.minor)')];
  const minors = [...document.querySelectorAll('.gap-marker.minor')];

  const seen = [];
  const original = v.showToast.bind(v);
  v.showToast = (text, ...rest) => { seen.push(String(text)); return original(text, ...rest); };
  if (majors[0]) majors[0].click();
  await sleep(80);
  const afterMajor = seen.slice();
  const majorCount = seen.length;
  if (minors[0]) minors[0].click();
  await sleep(80);
  const minorAdded = seen.length - majorCount;
  const afterMinor = seen.slice();
  v.showToast = original;

  out.markers = {
    major: majors.length,
    minor: minors.length,
    majorLabel: majors[0] ? majors[0].getAttribute('aria-label') : null,
    minorPointer: minors[0] ? getComputedStyle(minors[0]).pointerEvents : null,
    minorAriaHidden: minors[0] ? minors[0].getAttribute('aria-hidden') : null,
    clickMajorSaid: afterMajor,
    clickMinorSaid: afterMinor,
    majorSpoke: afterMajor.some(t => /此处缺/.test(t)),
    minorSilent: minorAdded === 0,
    minorAdded,
  };
  return JSON.stringify(out);
})()

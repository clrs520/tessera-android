// R159 — a seam shorter than the major threshold: 'holes' shows only the big holes, 'all' adds
// a decoration tick for every smaller seam; those ticks must not take hits or screen-reader space.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { harness: null, gaps: null, holes: null, all: null, restored: null };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  await v.loadTauriDirectory('/storage/emulated/0/TeslaCamGap');
  for (let i = 0; i < 80 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-10-10_10-00-00/.test(g.eventId));
  if (!ev) { out.harness = 'gap fixture missing'; return JSON.stringify(out); }

  await v.playEvent(ev.eventId);
  for (let i = 0; i < 120 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);
  const vc = v.videoControls;
  out.gaps = {
    total: +vc.totalDuration.toFixed(2),
    durations: (ev.segmentDurations || []).map(d => +d.toFixed(2)),
    starts: (ev.segmentStartTimes || []).map(d => +d.toFixed(2)),
    gaps: (ev.segmentGaps || []).map(d => +d.toFixed(2)),
    minGapFloor: +Math.max(5, vc.totalDuration / 200).toFixed(2),
  };
  if (!(vc.totalDuration > 0)) { out.harness = 'no total'; return JSON.stringify(out); }

  const count = (mode) => {
    v.setGapMarkMode(mode);
    vc.addGapMarkers(ev);
    const nodes = [...document.querySelectorAll('.gap-marker')];
    return {
      mode: v.gapMarkMode(),
      major: nodes.filter(n => !n.classList.contains('minor')).length,
      minor: nodes.filter(n => n.classList.contains('minor')).length,
      minorPointer: nodes.filter(n => n.classList.contains('minor')).map(n => getComputedStyle(n).pointerEvents)[0] || null,
      minorTabIndex: nodes.filter(n => n.classList.contains('minor')).map(n => n.tabIndex)[0] ?? null,
      minorAriaHidden: nodes.filter(n => n.classList.contains('minor')).map(n => n.getAttribute('aria-hidden'))[0] ?? null,
      minorLabel: nodes.filter(n => n.classList.contains('minor')).map(n => n.getAttribute('aria-label'))[0] ?? null,
      majorLabels: nodes.filter(n => !n.classList.contains('minor')).map(n => n.getAttribute('aria-label')),
    };
  };
  out.holes = count('holes');
  out.all = count('all');
  v.setGapMarkMode('all');
  out.restored = { stored: v.gapMarkMode() };
  return JSON.stringify(out);
})()

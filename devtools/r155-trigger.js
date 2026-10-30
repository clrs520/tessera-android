// R155 · 触发标注回归判据：真实 event.json 里的 reason 是英文句子，
// 必须能被识别成触发原因、并落到对应的相机上。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const out = {};

  // 1) Pure parsing, against every shape a real library carries.
  const cases = {
    sentence: { eventId: 'TeslaCam/SavedClips/2026-09-29_12-30-00', reason: 'Motion detected while parked' },
    slug: { eventId: 'TeslaCam/SavedClips/2026-09-29_12-30-00_sentry_motion' },
    other: { eventId: 'TeslaCam/SavedClips/2026-09-29_12-30-00', reason: 'user_interaction_dashcam_icon_tapped' },
    unknown: { eventId: 'TeslaCam/SavedClips/2026-09-29_12-30-00', reason: 'Something Tesla invented later' },
    none: { eventId: 'TeslaCam/SavedClips/2026-09-29_12-30-00' },
    // A folder suffix is a name, not a claim: `..._gap` must stay ordinary.
    folderOnly: { eventId: 'TeslaCam/SavedClips/2026-10-09_12-00-00_gap' },
  };
  out.parse = {};
  for (const [k, ev] of Object.entries(cases)) {
    const hit = v.triggerViewsFor(ev);
    out.parse[k] = hit ? { views: hit.views, label: hit.label.zh } : null;
  }
  out.verdict = {
    sentenceRead: !!out.parse.sentence && out.parse.sentence.label === '哨兵',
    slugRead: !!out.parse.slug && out.parse.slug.label === '哨兵',
    unknownNotDropped: !!out.parse.unknown && out.parse.unknown.views.length > 0,
    noReasonStaysNull: out.parse.none === null,
    folderNameNotATrigger: out.parse.folderOnly === null,
  };

  // 2) On screen: the amber frame must exist on the cells the reason names.
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 60 && !(v.eventGroups || []).length; i++) await sleep(250);
  const ev = (v.eventGroups || []).find(g => /2026-09-29_12-30-00/.test(g.eventId));
  if (!ev) { out.harness = 'event missing'; return JSON.stringify(out, null, 1); }
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 80 && !(v.videoControls.totalDuration > 0); i++) await sleep(250);
  await sleep(2000);
  const cells = [...document.querySelectorAll('#playerArea .video-container')].map(c => ({
    cam: c.dataset.camera,
    trig: c.classList.contains('trigger-cam'),
    frame: !!c.querySelector('.trigger-frame'),
  }));
  out.screen = { enabled: v.triggerHighlightEnabled(), cells };
  const marked = cells.filter(c => c.trig);
  out.verdict.frameOnNamed = marked.length === 3
    && marked.every(c => ['front', 'left', 'right'].includes(c.cam))
    && marked.every(c => c.frame);

  // 3) 「只看触发」 filter keeps this event and drops one with no reason at all.
  const withReason = ev;
  const without = (v.eventGroups || []).find(g => !v.eventReason(g));
  out.verdict.filterKeepsTriggered = !!v.triggerViewsFor(withReason);
  out.verdict.filterDropsPlain = without ? v.triggerViewsFor(without) === null : true;

  out.pass = Object.values(out.verdict).every(Boolean);
  return JSON.stringify(out, null, 1);
})()

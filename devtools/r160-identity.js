// R160 — favorites and resume positions must survive switching RecentClips view mode.
// Desired semantics:
//   * a starred whole-RecentClips covers every new group (all day/session groups starred);
//   * a subgroup star only covers a merged view when the merged view is fully covered;
//   * the resume position follows the clip it points at, even if the group id changes;
//   * a stored position whose id is gone is still found by its clip path.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const K = { star: 'tdashcam.starred', pos: 'tdashcam.playbackPos', split: 'tdashcam.recentSplit' };
  const backup = { star: localStorage.getItem(K.star), pos: localStorage.getItem(K.pos), split: localStorage.getItem(K.split) };
  const out = { results: [], failed: 0, harness: null };
  const rec = (name, ok, detail) => {
    out.results.push({ name, ok: !!ok, detail });
    if (!ok) out.failed += 1;
  };
  if (!v) { out.harness = 'no viewer'; return JSON.stringify(out); }

  const waitGroups = async (n) => {
    for (let i = 0; i < 120 && (v.eventGroups || []).length !== n; i++) await sleep(100);
    return v.eventGroups || [];
  };
  const near = (a, b) => Math.abs(a - b) < 0.06;

  try {
    await v.setRecentSplit('none');
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCamSplit');
    let groups = await waitGroups(1);
    const whole = groups.find(e => e.eventType === 'RecentClips' && e.segments.length === 5);
    rec('none: one whole event of 5 clips', whole, { groups: groups.map(e => `${e.eventId}|${e.segments.length}`) });
    if (!whole) throw new Error('fixture not grouped');

    v.toggleStar(whole.eventId);
    const anchor = whole.segments[3].files.front.path;
    const writeMap = (map) => localStorage.setItem(K.pos, JSON.stringify(map));
    writeMap({ [whole.eventId]: { i: 3, t: 12.3, path: anchor } });

    await v.setRecentSplit('day');
    await sleep(400);
    const day2 = v.eventGroups.find(e => String(e.startTime).startsWith('2026-01-02'));
    const day1 = v.eventGroups.find(e => String(e.startTime).startsWith('2026-01-01'));
    if (day2) await v.continuousPlayer.calculateEventDurations(day2);
    rec('day: whole star covers both days', day2 && day1 && v.isStarred(day2.eventId) && v.isStarred(day1.eventId),
      { day2: day2 && v.isStarred(day2.eventId), day1: day1 && v.isStarred(day1.eventId) });
    const day2Expected = day2.segmentStartTimes[1] + 12.3;
    rec('day: resume follows the same clip', near(v.savedPositionFor(day2), day2Expected),
      { got: v.savedPositionFor(day2), expected: day2Expected });

    await v.setRecentSplit('session');
    await sleep(400);
    const sess = v.eventGroups.find(e => String(e.startTime) === '2026-01-02_09-00-00');
    if (sess) await v.continuousPlayer.calculateEventDurations(sess);
    rec('session: whole star covers the sessions', sess && v.isStarred(sess.eventId),
      { sessions: v.eventGroups.map(e => `${e.startTime}|${e.segments.length}`) });
    const sessExpected = sess.segmentStartTimes[1] + 12.3;
    rec('session: resume follows the same clip', near(v.savedPositionFor(sess), sessExpected),
      { got: v.savedPositionFor(sess), expected: sessExpected });

    // The clip path is the anchor: an id from a rolled-off/renamed group still restores.
    const fallbackAnchor = sess.segments[1].files.front.path;
    writeMap({ 'stale#id': { i: 0, t: 5, path: fallbackAnchor } });
    const fallbackExpected = sess.segmentStartTimes[1] + 5;
    rec('position found by clip path when its id is gone', near(v.savedPositionFor(sess), fallbackExpected),
      { got: v.savedPositionFor(sess), expected: fallbackExpected });

    writeMap({ [whole.eventId]: { i: 3, t: 12.3, path: anchor } });
    await v.setRecentSplit('none');
    await sleep(400);
    const wholeAgain = v.eventGroups.find(e => e.eventType === 'RecentClips' && e.segments.length === 5);
    if (wholeAgain) await v.continuousPlayer.calculateEventDurations(wholeAgain);
    rec('none: star survives the round trip', wholeAgain && v.isStarred(wholeAgain.eventId),
      { id: wholeAgain && wholeAgain.eventId });
    rec('none: resume survives the round trip',
      wholeAgain && near(v.savedPositionFor(wholeAgain), wholeAgain.segmentStartTimes[3] + 12.3),
      { got: wholeAgain && v.savedPositionFor(wholeAgain), expected: wholeAgain && (wholeAgain.segmentStartTimes[3] + 12.3) });

    // Conservative merge rule: one starred day must NOT claim the whole folder.
    await v.setRecentSplit('day');
    await sleep(400);
    for (const e of v.eventGroups) v.starredIds.delete(e.eventId);
    v.starredIds.delete(whole.eventId);
    const onlyDay1 = v.eventGroups.find(e => String(e.startTime).startsWith('2026-01-01'));
    v.starredIds.add(onlyDay1.eventId);
    localStorage.setItem(K.star, JSON.stringify([...v.starredIds]));
    await v.setRecentSplit('none');
    await sleep(400);
    const merged = v.eventGroups.find(e => e.eventType === 'RecentClips' && e.segments.length === 5);
    rec('partial day star does not star the merged view', merged && !v.isStarred(merged.eventId),
      { mergedStarred: merged && v.isStarred(merged.eventId) });
    await v.setRecentSplit('day');
    await sleep(400);
    const day1Back = v.eventGroups.find(e => String(e.startTime).startsWith('2026-01-01'));
    rec('the starred day is still starred when going back', day1Back && v.isStarred(day1Back.eventId),
      { day1: day1Back && v.isStarred(day1Back.eventId) });
  } catch (e) {
    out.harness = String(e && e.message || e);
  } finally {
    if (backup.star === null) localStorage.removeItem(K.star); else localStorage.setItem(K.star, backup.star);
    if (backup.pos === null) localStorage.removeItem(K.pos); else localStorage.setItem(K.pos, backup.pos);
    if (backup.split === null) localStorage.removeItem(K.split); else localStorage.setItem(K.split, backup.split);
    v.starredIds = v.loadStarred();
    try { await v.setRecentSplit(backup.split === 'day' || backup.split === 'session' ? backup.split : 'none'); } catch (e) { /* ignore */ }
  }
  return JSON.stringify(out);
})()

// R151 判据（批一）：#19 菜单跨过 3s 那一拍后控件条还能不能自己收走；#20 glide 速率随切主画面复位。
// 两条都用真 handler 驱动，但 #20 的 glide 状态是直接摆出来的（纠偏器要真漂移才触发，AVD 上不可控），
// 这一条测的是「提成主画面」这个契约，不是 glide 本身。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { checks: [], pass: 0, total: 0, harness: null };
  const ok = (name, pass, detail) => { out.total++; if (pass) out.pass++; out.checks.push({ name, pass: !!pass, detail }); };

  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  // The first group can be a six-second sentry clip that finishes inside the 7 s sequence below;
  // take the one with the most segments (RecentClips has 10) so the timeline outlives the checks.
  const ev = v.eventGroups.reduce((a, g) => ((g.segments || []).length > ((a && a.segments) || []).length ? g : a), null);
  if (ev && (!v.currentEvent || v.currentEvent.eventId !== ev.eventId)) { await v.playEvent(ev.eventId); await sleep(4000); }

  const vc = v.videoControls;
  const mc = v.multiCameraPlayer;
  if (vc && !vc.isPlaying) vc.togglePlayPause();
  for (let i = 0; i < 60 && !(vc && vc.isPlaying); i++) await sleep(250);
  // The bar hides by itself after 3 s of playback; bring it up explicitly instead of treating
  // "hidden because it is playing" as a harness failure.
  if (vc && vc.isPlaying) { vc.resetHideTimer(); await sleep(150); }
  if (!vc || !vc.isPlaying || !vc.overlay.classList.contains('show')) {
    out.harness = { playing: !!vc && vc.isPlaying, shown: !!vc && vc.overlay.classList.contains('show') };
    return JSON.stringify(out);
  }

  // ① #19 —— 菜单开着跨过 3s 那一拍；随后在画面外点一下把菜单关掉（body click，不落在
  //    playerArea 上，因此不会经由容器的 pointerdown/click 监听重新起表——这正是漏账的现场）。
  vc.speedBtn.click();
  await sleep(200);
  const opened = vc.speedControl.classList.contains('active');
  await sleep(3300);
  document.body.click();
  await sleep(200);
  const closed = !vc.speedControl.classList.contains('active');
  for (let i = 0; i < 32 && vc.overlay.classList.contains('show'); i++) await sleep(250);
  ok('controls hide again after a menu outlives the 3s tick',
    opened && closed && vc.isPlaying && !vc.overlay.classList.contains('show'),
    { opened, closed, playing: vc.isPlaying, stillShown: vc.overlay.classList.contains('show') });

  // ② #20 —— 纠偏器只修正非 activeCamera（syncAllPlayers 首行跳过它），所以 glide 中的那一路
  //    被提成主画面后必须把速率交回基准，否则主画面永久 1.08×/0.926×。
  const other = Object.keys(mc.players)
    .find(k => k !== mc.activeCamera && mc.players[k] && mc.players[k].src);
  if (!other) { out.harness = 'no second feed with src'; return JSON.stringify(out); }
  const base = mc.effectiveRate();
  const origCam = mc.activeCamera;
  mc.players[other].playbackRate = base * 1.08;
  mc.feedStats[other].gliding = true;
  mc.setCamera(other);
  await sleep(300);
  ok('promoted feed drops its glide rate',
    mc.activeCamera === other
      && !mc.feedStats[other].gliding
      && Math.abs(mc.players[other].playbackRate - base) < 0.001,
    { cam: other, base, after: mc.players[other].playbackRate, gliding: mc.feedStats[other].gliding, active: mc.activeCamera });
  mc.players[other].playbackRate = base;
  Object.values(mc.feedStats).forEach(s => { if (s) s.gliding = false; });
  if (origCam && mc.players[origCam]) mc.setCamera(origCam);

  return JSON.stringify(out);
})()

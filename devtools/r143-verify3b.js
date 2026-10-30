(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const zh = /[\u4e00-\u9fff]/;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const mcp = v.multiCameraPlayer, cp = v.continuousPlayer, ctl = v.videoControls;

  // ── #13 语言：英文下不该还有中文无障碍名 ───────────────────────────────────────
  v.setLanguage('en');
  await sleep(400);
  const stale = [];
  document.querySelectorAll('[aria-label]').forEach(el => {
    const a = el.getAttribute('aria-label');
    if (zh.test(a) && !String(el.className).includes('flatpickr') && a !== '切换到中文') {
        stale.push((el.id || el.tagName) + '=' + a);
    }
  });
  add('no-chinese-aria-labels-in-english', stale.length === 0, stale);
  const nameless = ['filterToggleBtn', 'clearDateBtn'].filter(id => {
      const el = document.getElementById(id);
      return !el || (!el.getAttribute('aria-label') && !el.textContent.trim());
  });
  add('icon-buttons-have-a-name', nameless.length === 0, nameless);
  v.setLanguage('zh');
  await sleep(300);

  // ── #12 换段瞬间 UA 自己 pause，不该把 isPlaying 打回 false ─────────────────────
  v.loopAB = false;
  await cp.seekToTime(0.2);
  await sleep(1200);
  mcp.playAll();
  let sawTransition = false, droppedWhileTransitioning = 0, samples = 0;
  const t1 = Date.now();
  while (Date.now() - t1 < 20000) {
      if (cp.isTransitioning || mcp.seam) sawTransition = true;
      samples++;
      if ((cp.isTransitioning || mcp.seam) && !mcp.isPlaying) droppedWhileTransitioning++;
      await sleep(60);
  }
  add('seam-pause-keeps-playing-flag', sawTransition && droppedWhileTransitioning === 0,
      { sawTransition, droppedWhileTransitioning, samples });

  // ── #10 长按临时倍速不得被纠偏器写回 1× ────────────────────────────────────────
  mcp.pauseAll();
  await sleep(300);
  v.setTransientPlaybackRate(3);
  const held = Object.entries(mcp.players).map(([k, p]) => k + '=' + p.playbackRate).join(' ');
  // Manufacture the drift the corrector reacts to: hold one feed back, then let it run again.
  mcp.players.back.pause();
  mcp.playAll();
  await sleep(6000);
  mcp.players.back.play();
  await sleep(6000);
  const rates = Object.entries(mcp.players).map(([k, p]) => k + '=' + p.playbackRate);
  const stomped = rates.filter(r => !r.endsWith('=3'));
  add('transient-rate-survives-correction', stomped.length === 0, { held, rates,
      thisPlaybackRate: mcp.playbackRate });
  v.setTransientPlaybackRate(1);
  mcp.pauseAll();

  
  const failed = checks.filter(c => !c.pass).length;
  return JSON.stringify({ total: checks.length, failed, checks }, null, 1);
})()

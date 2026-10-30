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

  // ── #11 A–B 循环不得吞掉用户显式拖出去的 seek ──────────────────────────────────
  const ev = v.eventGroups.find(g => (g.segments || []).length >= 3);
  v.playEvent(ev);
  const t0 = Date.now();
  while (!v.currentEvent && Date.now() - t0 < 20000) await sleep(200);
  await sleep(2500);
  const total = ctl.totalDuration;
  ctl.clipStartTime = 2; ctl.clipEndTime = 4;
  v.loopAB = true; ctl.loopABSeeking = false;
  await cp.seekToTime(Math.min(total - 0.5, 5.5));
  await sleep(2500);
  const after = cp.getCurrentTime();
  add('loop-ab-keeps-an-explicit-seek', after > 4.5, { total, askedFor: 5.5, landedAt: +after.toFixed(2) });
  v.loopAB = false;

  
  const failed = checks.filter(c => !c.pass).length;
  return JSON.stringify({ total: checks.length, failed, checks }, null, 1);
})()

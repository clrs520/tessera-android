// R150 判据（第 5 批可达性/文案）：只读页面状态，不点画面。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = { checks: [], pass: 0, total: 0 };
  const ok = (name, pass, detail) => { out.total++; if (pass) out.pass++; out.checks.push({ name, pass: !!pass, detail }); };

  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  const ev = v.eventGroups.find(g => (g.segments || []).length);
  if (ev && (!v.currentEvent || v.currentEvent.eventId !== ev.eventId)) { await v.playEvent(ev.eventId); await sleep(2500); }

  // ① 视图按钮：span 不能被 display:none 摘出可访问树；每个按钮都要有 aria-pressed
  const btns = [...document.querySelectorAll('.view-btn')];
  const spans = btns.map(b => b.querySelector('span')).filter(Boolean);
  const spanHidden = spans.filter(s => getComputedStyle(s).display === 'none');
  const noPressed = btns.filter(b => !b.hasAttribute('aria-pressed'));
  const trues = btns.filter(b => b.getAttribute('aria-pressed') === 'true');
  ok('view-btn names stay in the accessibility tree', spans.length > 0 && spanHidden.length === 0,
    { buttons: btns.length, spans: spans.length, displayNone: spanHidden.length });
  ok('view-btn exposes aria-pressed, exactly one true',
    noPressed.length === 0 && trues.length === 1,
    { missing: noPressed.length, trueCount: trues.length });

  // ② 顶部 ⋮ 的 aria-expanded 跟着面板走
  const menuBtn = document.getElementById('headerMenuBtn');
  const right = document.getElementById('headerRight');
  const before = menuBtn && menuBtn.getAttribute('aria-expanded');
  menuBtn && menuBtn.click();
  await sleep(200);
  const opened = menuBtn && menuBtn.getAttribute('aria-expanded');
  document.body.click();
  await sleep(200);
  const closed = menuBtn && menuBtn.getAttribute('aria-expanded');
  ok('header menu aria-expanded follows the panel',
    before === 'false' && opened === 'true' && closed === 'false',
    { before, opened, closed, panelOpen: right ? right.classList.contains('active') : null });

  // ③ 复制路径的无障碍名跟随语言
  const cp = document.getElementById('copyPathBtn');
  const zh = cp ? cp.getAttribute('aria-label') : null;
  v.setLanguage('en');
  await sleep(500);
  const en = cp ? cp.getAttribute('aria-label') : null;
  ok('copy-path aria-label follows language',
    zh === '复制路径' && en === 'Copy path', { zh, en });

  // ④ 英文文案里不该夹中文 / 不该有 view(s)
  const t = i18n[v.currentLanguage] || {};
  const cjk = /[\u4e00-\u9fff]/;
  ok('english usb hint has no chinese', !cjk.test(t.usbFoundClips || ''), { usb: t.usbFoundClips });
  ok('english darkAll reads as english', !/view\(s\)/.test(t.peEngine_darkAll || ''), { darkAll: t.peEngine_darkAll });

  v.setLanguage('zh');
  await sleep(300);
  return JSON.stringify(out);
})()

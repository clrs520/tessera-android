(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const zh = /[\u4e00-\u9fff]/;
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
  const ratio = (a, b) => { const x = lum(...a), y = lum(...b);
    return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };

  // ── #8 深色导出主按钮：白字压在填充上必须过 AA ────────────────────────────────
  localStorage.setItem('tdashcam.themeMode', 'dark');
  v.applyTheme(true);
  await new Promise(r => setTimeout(r, 300));
  // `showPhoneExportModal()` resolves a frame before the sheet's `.show` lands, and the language
  // rebuild is gated on that class — measuring inside the opening animation asks the page to answer
  // a question it was never asked. Wait for the sheet to actually be up.
  const sheet = document.getElementById('phoneExportModal');
  if (!sheet.classList.contains('show')) await v.showPhoneExportModal();
  {
    const t = Date.now();
    while (!sheet.classList.contains('show') && Date.now() - t < 3000) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  await new Promise(r => setTimeout(r, 400));
  const go = document.getElementById('peStartBtn');
  const wasDisabled = go.disabled;
  go.disabled = false;                                    // 启用态才是要看的那一档
  const s = getComputedStyle(go);
  const cr = ratio(rgb(s.color), rgb(s.backgroundColor));
  add('dark-export-cta-contrast', cr >= 4.5, { color: s.color, bg: s.backgroundColor, cr });
  go.disabled = wasDisabled;

  // ── #9 导出页语言跟随：静态节点 + JS 重建的行 ─────────────────────────────────
  v.setLanguage('en');
  await new Promise(r => setTimeout(r, 700));
  const texts = {};
  ['phoneExportTitle', 'peStartBtn', 'peCancelBtn', 'pePreviewBtn', 'peLayoutResetBtn']
      .forEach(id => { texts[id] = document.getElementById(id).textContent.trim(); });
  const staticChinese = Object.entries(texts).filter(([, t]) => zh.test(t)).map(([k, t]) => k + '=' + t);
  add('export-page-static-labels-follow-language', staticChinese.length === 0, staticChinese);

  const body = document.querySelector('.phone-export-panel');
  const stale = [...body.querySelectorAll('button')]
      .filter(b => b.textContent.trim() === '源')
      .map(b => ({ where: (b.parentElement.id || b.parentElement.className), cls: b.className,
                   lang: v.currentLanguage, job: !!v.peJob, starting: !!v.peStarting }));
  const built = [...body.querySelectorAll('.pe-size button, .pe-size .pe-seg-btn, button')]
      .map(b => b.textContent.trim()).filter(t => t === '源' || t === '无元数据' || t === 'Source');
  add('export-page-built-rows-follow-language', !built.includes('源'), stale.length ? stale : built);

  v.setLanguage('zh');
  localStorage.setItem('tdashcam.themeMode', 'auto');
  v.applyTheme(v.resolveThemeDark('auto'));
  if (typeof v.hidePhoneExportModal === 'function') v.hidePhoneExportModal();
  await new Promise(r => setTimeout(r, 300));

  const failed = checks.filter(c => !c.pass).length;
  return JSON.stringify({ total: checks.length, failed, checks }, null, 1);
})()

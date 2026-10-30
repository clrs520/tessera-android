(async () => {
  const v = window.viewer;
  const zh = /[\u4e00-\u9fff]/;
  const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const ratioRgbHex = (fgRgb, bgRgb) => { const a = lum(...fgRgb), b = lum(...bgRgb);
    return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };

  localStorage.setItem('tdashcam.themeMode', 'dark');
  v.applyTheme(true);
  await new Promise(r => setTimeout(r, 300));
  if (!document.getElementById('phoneExportModal').classList.contains('show')) await v.showPhoneExportModal();

  const go = document.getElementById('peStartBtn');
  go.disabled = false;                                   // read the enabled fill
  const s = getComputedStyle(go);
  const enabled = { bg: s.backgroundColor, color: s.color, opacity: s.opacity,
    ratioWhiteOnFill: ratioRgbHex(rgb(s.color), rgb(s.backgroundColor)) };
  go.disabled = true;

  // every node with a static Chinese aria-label, measured in English
  localStorage.setItem('tdashcam.language', 'en');
  v.currentLanguage = 'en';
  v.updateAllUIText('en');
  await new Promise(r => setTimeout(r, 300));
  const stale = [];
  document.querySelectorAll('[aria-label]').forEach(el => {
    const a = el.getAttribute('aria-label');
    if (zh.test(a)) stale.push((el.id || el.tagName + '.' + el.className) + ' = ' + a);
  });
  const nameless = ['filterToggleBtn', 'clearDateBtn'].map(id => {
    const el = document.getElementById(id);
    return { id, aria: el.getAttribute('aria-label'), title: el.getAttribute('title'),
      text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 12) };
  });
  const chineseVisible = [];
  document.querySelectorAll('#phoneExportPage, #phoneExportModal, .phone-export-panel, .pe-nav').forEach(() => {});
  ['phoneExportTitle', 'peStartBtn', 'peCancelBtn', 'pePreviewBtn', 'peLayoutResetBtn'].forEach(id => {
    const t = document.getElementById(id).textContent.trim();
    if (zh.test(t)) chineseVisible.push(id + ' = ' + t);
  });

  return JSON.stringify({ dark: document.body.classList.contains('dark-theme'), enabled,
    staleAriaCount: stale.length, staleAria: stale, nameless, chineseVisibleInEnglish: chineseVisible,
    lang: v.currentLanguage }, null, 1);
})()

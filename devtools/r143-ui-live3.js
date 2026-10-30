(async () => {
  const v = window.viewer;
  const zh = /[\u4e00-\u9fff]/;
  localStorage.setItem('tdashcam.themeMode', 'dark');
  v.applyTheme(true);
  await new Promise(r => setTimeout(r, 300));
  if (!document.getElementById('phoneExportModal').classList.contains('show')) await v.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 300));

  // the real language path, not updateAllUIText
  v.setLanguage('en');
  await new Promise(r => setTimeout(r, 500));

  const stale = [];
  document.querySelectorAll('[aria-label]').forEach(el => {
    const a = el.getAttribute('aria-label');
    if (zh.test(a) && !el.className.includes('flatpickr')) {
      stale.push((el.id || el.tagName + '.' + String(el.className).slice(0, 22)) + ' = ' + a);
    }
  });
  const chineseVisible = [];
  ['phoneExportTitle', 'peStartBtn', 'peCancelBtn', 'pePreviewBtn', 'peLayoutResetBtn'].forEach(id => {
    const el = document.getElementById(id);
    const t = el.textContent.trim();
    if (zh.test(t)) chineseVisible.push(id + ' = ' + t);
  });
  const hist = [...document.querySelectorAll('.pe-history-group, .pe-section-title, .phone-export-panel h3, .phone-export-panel .pe-group-title')]
    .map(e => e.textContent.trim()).filter(t => zh.test(t));

  const out = { lang: v.currentLanguage, staleAria: stale, staleCount: stale.length,
    chineseVisible, historyHeads: hist,
    notifSample: (i18n => i18n) ? null : null };
  return JSON.stringify(out, null, 1);
})()

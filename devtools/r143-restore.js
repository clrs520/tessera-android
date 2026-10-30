(async () => {
  const v = window.viewer;
  v.setLanguage('zh');
  localStorage.setItem('tdashcam.themeMode', 'auto');
  v.applyTheme(v.resolveThemeDark('auto'));
  if (typeof v.hidePhoneExportModal === 'function') v.hidePhoneExportModal();
  await new Promise(r => setTimeout(r, 400));
  return JSON.stringify({ lang: v.currentLanguage, dark: document.body.classList.contains('dark-theme'),
    title: document.getElementById('phoneExportTitle').textContent.trim() });
})()

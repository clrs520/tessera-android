(async () => {
  const v = window.viewer;
  if (!v) return 'no viewer';

  const lum = (r, g, b) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const ratio = (fg, bg) => { const a = lum(...parse(fg)), b = lum(...parse(bg));
    return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };

  // dark through the app's own path
  localStorage.setItem('tdashcam.themeMode', 'dark');
  v.applyTheme(true);
  await new Promise(r => setTimeout(r, 400));

  await v.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 500));

  const cs = (id) => { const el = document.getElementById(id); const s = getComputedStyle(el);
    return { id, visible: s.display !== 'none', text: el.textContent.trim(), color: s.color,
      bg: s.backgroundColor, opacity: s.opacity, disabled: !!el.disabled }; };
  const go = cs('peStartBtn');
  const cancel = cs('peCancelBtn');
  const seg = document.querySelector('.pe-seg button[aria-selected="true"]');

  const eff = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();
  const out = {
    dark: document.body.classList.contains('dark-theme'),
    accentOnHtml: eff(document.documentElement, '--accent'),
    accentOnBody: eff(document.body, '--accent'),
    tintOnBody: eff(document.body, '--glass-tint'),
    startBtn: go,
    startBtnWhiteRatio: ratio('#ffffff', go.bg),
    cancelBtn: cancel,
    segSelectedBg: seg ? getComputedStyle(seg).backgroundColor : null,
    title: cs('phoneExportTitle'),
    previewBtn: cs('pePreviewBtn'),
    resetBtn: cs('peLayoutResetBtn'),
  };

  // English: does anything rewrite these six?
  v.updateAllUIText('en');
  await new Promise(r => setTimeout(r, 300));
  out.afterEnglish = {
    title: document.getElementById('phoneExportTitle').textContent.trim(),
    start: document.getElementById('peStartBtn').textContent.trim(),
    cancel: document.getElementById('peCancelBtn').textContent.trim(),
    preview: document.getElementById('pePreviewBtn').textContent.trim(),
    reset: document.getElementById('peLayoutResetBtn').textContent.trim(),
    history: (document.querySelector('.pe-history-title') || {}).textContent || '(node not found)',
    zoomHintAria: (document.querySelector('#peZoomLayer [aria-label]') || {}).getAttribute
      ? document.querySelector('#peZoomLayer [aria-label]').getAttribute('aria-label') : null,
  };
  return JSON.stringify(out, null, 1);
})()

// R67-C: capture what 复制诊断 puts on the clipboard, without leaving the app.
(() => {
  window.__clip = null;
  const orig = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
  navigator.clipboard.writeText = t => { window.__clip = t; return Promise.resolve(); };
  if (!orig) window.__noClipboard = true;
  viewer.copyDiagnostics();
  return 'copyDiagnostics called';
})();

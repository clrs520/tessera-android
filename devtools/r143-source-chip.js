// 走 r143-verify2 的同一条序列（深色 → 开导出页 → 切英文），把 setLanguage 里的异常与
// renderPhoneExportPanel 的实际执行情况抓出来。只包一层记录，finally 复原原方法。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const size = () => [...document.querySelectorAll('#peSizeChips button')].map(b => b.textContent.trim());
  const proto = Object.getPrototypeOf(v);
  const realRender = proto.renderPhoneExportPanel;
  const log = [];
  proto.renderPhoneExportPanel = function () {
    try {
      const r = realRender.apply(this, arguments);
      log.push({ call: log.length + 1, lang: v.currentLanguage, threw: false, sizes: size() });
      return r;
    } catch (e) {
      log.push({ call: log.length + 1, lang: v.currentLanguage, threw: true,
                 error: String(e && e.message || e), at: String(e && e.stack || '').split('\n')[1] });
      throw e;
    }
  };
  try {
    localStorage.setItem('tdashcam.themeMode', 'dark');
    v.applyTheme(true);
    v.setLanguage('zh');
    await sleep(300);
    if (!document.getElementById('phoneExportModal').classList.contains('show')) {
      await v.showPhoneExportModal();
      await sleep(400);
    }
    log.push({ at: 'opened', lang: v.currentLanguage, sizes: size() });
    const go = document.getElementById('peStartBtn');
    const wasDisabled = go.disabled;
    go.disabled = false;
    await sleep(50);
    go.disabled = wasDisabled;
    let setLangError = null;
    try { v.setLanguage('en'); } catch (e) { setLangError = String(e && e.message || e); }
    await sleep(700);
    const out = { setLangError, lang: v.currentLanguage, sizes: size(), log };
    v.setLanguage('zh');
    localStorage.setItem('tdashcam.themeMode', 'auto');
    v.applyTheme(v.resolveThemeDark('auto'));
    if (typeof v.hidePhoneExportModal === 'function') v.hidePhoneExportModal();
    return JSON.stringify(out, null, 1);
  } finally {
    proto.renderPhoneExportPanel = realRender;
  }
})()

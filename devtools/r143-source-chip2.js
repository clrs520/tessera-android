// 上一条探针的续：切语言那一刻，导出页的 show 态与 peDom 到底长什么样。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const size = () => [...document.querySelectorAll('#peSizeChips button')].map(b => b.textContent.trim());
  const modal = document.getElementById('phoneExportModal');
  const proto = Object.getPrototypeOf(v);
  const realRender = proto.renderPhoneExportPanel;
  let calls = 0;
  proto.renderPhoneExportPanel = function () {
    calls++;
    return realRender.apply(this, arguments);
  };
  const snap = (tag) => ({ tag, lang: v.currentLanguage, calls,
      cls: modal.className, sameModal: !!(v.peDom && v.peDom.modal === modal),
      peDom: !!v.peDom, sizes: size() });
  try {
    v.setLanguage('zh');
    localStorage.setItem('tdashcam.themeMode', 'dark');
    v.applyTheme(true);
    await sleep(300);
    if (!modal.classList.contains('show')) { await v.showPhoneExportModal(); await sleep(500); }
    const before = snap('before-flip');
    const c0 = calls;
    v.setLanguage('en');
    const sync = snap('sync-after-setLanguage');
    await sleep(700);
    const after = snap('after-700ms');
    const out = { before, sync, after, renderDuringFlip: calls - c0,
      // 谁在切语言之后又改写过这排 chip
      styleAttr: modal.getAttribute('style') };
    v.setLanguage('zh');
    localStorage.setItem('tdashcam.themeMode', 'auto');
    v.applyTheme(v.resolveThemeDark('auto'));
    if (typeof v.hidePhoneExportModal === 'function') v.hidePhoneExportModal();
    return JSON.stringify(out, null, 1);
  } finally {
    proto.renderPhoneExportPanel = realRender;
  }
})()

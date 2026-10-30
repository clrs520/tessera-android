(() => {
  const b = document.querySelector('#drawerDoneBtn');
  const before = b.textContent;
  window.viewer.setLanguage('en');
  const en = b.textContent;
  window.viewer.setLanguage('zh');
  return JSON.stringify({ before, en, after: b.textContent, title: document.querySelector('.sidebar-header .header-title').textContent.trim() });
})()

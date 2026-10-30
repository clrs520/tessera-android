(() => {
  const t = id => document.getElementById(id)?.textContent.trim();
  return JSON.stringify({
    open: document.getElementById('headerRight').classList.contains('active'),
    sortOrder: t('sortOrderBtn'),
    keep: t('autoNextBtn') + '|' + t('triggerHlBtn'),
    dir: viewer?.sortDirection
  });
})()

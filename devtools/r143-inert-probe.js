(async () => {
  const v = window.viewer;
  const main = document.querySelector('.main-content');
  const bar = document.querySelector('#phoneActionBar');
  const out = { mainFound: !!main, barFound: !!bar,
    mainClass: main ? main.className : null, mainTag: main ? main.tagName : null,
    overlays: [...document.querySelectorAll('.modal-overlay')].length,
    showOverlays: [...document.querySelectorAll('.modal-overlay')].map(o => o.id + ':' + o.classList.contains('show')) };
  more = document.getElementById('tabMoreBtn'); more.focus();
  out.before = { mainInert: main.inert, barInert: bar.inert, active: document.activeElement.id };
  // 复现 verify3 的顺序：它在这里之前换过两次语言，standalone 不换就通过
  v.setLanguage('en'); await new Promise(r => setTimeout(r, 600));
  v.setLanguage('zh'); await new Promise(r => setTimeout(r, 600));
  out.afterLang = { mainInert: main.inert, mainSameAsQuery: main === document.querySelector('.main-content'),
    mainCount: document.querySelectorAll('.main-content').length,
    barSame: bar === document.querySelector('#phoneActionBar') };
  await v.showPhoneExportModal();
  await new Promise(r => setTimeout(r, 600));
  out.open = { sheetOpen: v.sheetOpen ? (v.sheetOpen.id || v.sheetOpen.className) : null,
    mainInert: main.inert, mainAttr: main.getAttribute('inert'),
    barInert: bar.inert, active: document.activeElement.id,
    shownNow: [...document.querySelectorAll('.modal-overlay.show')].map(o => o.id) };
  await new Promise(r => setTimeout(r, 900));
  out.later = { mainInert: main.inert, barInert: bar.inert, active: document.activeElement.id,
    sheetOpen: v.sheetOpen ? (v.sheetOpen.id || v.sheetOpen.className) : null };
  v.hidePhoneExportModal();
  await new Promise(r => setTimeout(r, 600));
  out.closed = { mainInert: main.inert, barInert: bar.inert, active: document.activeElement.id };
  return JSON.stringify(out, null, 1);
})()

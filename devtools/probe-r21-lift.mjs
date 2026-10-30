// Where is the sheet right now, and what is it reserving at the bottom?
//   node devtools/cdp-eval.mjs --file devtools/probe-r21-lift.mjs
(() => {
  const sheet = document.querySelector('.phone-export-sheet');
  const panel = document.querySelector('.phone-export-panel');
  const start = document.getElementById('peStartInput');
  const s = getComputedStyle(sheet);
  const p = panel.getBoundingClientRect();
  return JSON.stringify({
    kbH: getComputedStyle(document.documentElement).getPropertyValue('--kb-h').trim(),
    active: document.activeElement?.id || null,
    vv: [Math.round(window.visualViewport?.height || 0), Math.round(window.visualViewport?.offsetTop || 0)],
    sheetPadBottom: s.paddingBottom,
    sheetAlign: s.alignItems,
    sheetVar: s.getPropertyValue('--sheet-bottom').replace(/\s+/g, ' '),
    panel: Math.round(p.width) + 'x' + Math.round(p.height) + '@' + Math.round(p.left) + ',' + Math.round(p.top),
    panelBottom: Math.round(p.bottom),
    startBottom: Math.round(start.getBoundingClientRect().bottom),
    scroll: Math.round(panel.scrollTop) + '/' + Math.round(panel.scrollHeight) + '/' + Math.round(panel.clientHeight),
  }, null, 1);
})();

// Read-only geometry probe for the clip/export entry path.
//   node devtools/cdp-eval.mjs --file devtools/probe-r21-entry.mjs
(() => {
  const centre = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.round(r.left + r.width / 2) + ',' + Math.round(r.top + r.height / 2);
  };
  const state = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top);
  };
  const out = {
    inner: [innerWidth, innerHeight],
    kbH: getComputedStyle(document.documentElement).getPropertyValue('--kb-h').trim(),
    actionH: getComputedStyle(document.documentElement).getPropertyValue('--action-h').trim(),
    sidebar: centre(document.querySelector('.sidebar')),
    sidebarOpen: document.querySelector('.sidebar')?.getBoundingClientRect().left,
    card: centre(document.querySelector('.video-card')),
    cards: document.querySelectorAll('.video-card').length,
    clipBtn: state(document.getElementById('clipBtn')),
    confirmClip: state(document.getElementById('confirmClipBtn')),
    sheet: state(document.getElementById('phoneExportModal')),
    range: state(document.querySelector('.pe-range')),
    nudge: state(document.querySelector('.pe-nudge')),
    panel: state(document.querySelector('.phone-export-panel')),
  };
  return JSON.stringify(out, null, 1);
})();

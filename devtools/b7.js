// R67-C: is the brightness row reachable in the ⋮ panel, and where does a real finger have to land?
(() => {
  const b = document.getElementById('brightnessRowBtn');
  const r = b.getBoundingClientRect();
  const more = document.getElementById('tabMoreBtn');
  const m = more.getBoundingClientRect();
  const panel = b.closest('.header-actions-group') || b.parentElement;
  const pr = panel.getBoundingClientRect();
  return {
    more: { cx: Math.round(m.left + m.width / 2), cy: Math.round(m.top + m.height / 2), w: Math.round(m.width), h: Math.round(m.height) },
    row: { cx: Math.round(r.left + r.width / 2), cy: Math.round(r.top + r.height / 2), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0, disabled: b.disabled, text: document.getElementById('brightnessRowLabel').textContent },
    panelRect: { t: Math.round(pr.top), b: Math.round(pr.bottom), h: Math.round(pr.height), sh: panel.scrollHeight, ch: panel.clientHeight, oy: getComputedStyle(panel).overflowY },
    openRows: [...panel.querySelectorAll('button')].filter(x => x.getBoundingClientRect().height > 0).length
  };
})();

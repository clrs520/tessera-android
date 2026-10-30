(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const sb = document.getElementById('sidebar') || document.querySelector('.sidebar');
  const chips = document.getElementById('dateChips');
  const list = document.getElementById('fileList') || document.querySelector('.video-list');
  const chipsChip = chips ? [...chips.querySelectorAll('.date-chip')].slice(0, 4).map(c => ({ t: c.textContent.trim(), rect: r(c) })) : [];
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    collapsed: sb ? sb.classList.contains('collapsed') : 'no-sidebar',
    sbRect: sb ? r(sb) : null,
    sbTransform: sb ? cs(sb).transform : null,
    chips: chips ? { rect: r(chips), sw: chips.scrollWidth, cw: chips.clientWidth, sl: chips.scrollLeft, n: chips.children.length } : null,
    chipSamples: chipsChip,
    list: list ? { rect: r(list), sh: list.scrollHeight, ch: list.clientHeight, st: list.scrollTop, sw: list.scrollWidth, cw: list.clientWidth } : null
  }, null, 1);
})()

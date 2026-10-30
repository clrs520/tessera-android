(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const pa = document.querySelector('.player-area');
  const header = document.querySelector('.main-header');
  const bar = document.querySelector('.phone-action-bar');
  const cont = pa ? pa.querySelector('.video-container') : null;
  const out = {
    vp: [innerWidth, innerHeight],
    body: document.body.className,
    pa: pa ? { cls: pa.className, rect: r(pa), pad: cs(pa).padding, align: cs(pa).alignContent, rows: cs(pa).gridTemplateRows, cols: cs(pa).gridTemplateColumns, z: cs(pa).zIndex } : 'missing',
    header: header ? { d: cs(header).display, rect: r(header), op: cs(header).opacity } : 'missing',
    bar: bar ? { d: cs(bar).display, rect: r(bar) } : 'missing',
    cell1: cont ? r(cont) : 'missing',
    cells: pa ? [...pa.querySelectorAll('.video-container')].map(c => r(c)) : [],
    controlsH: cs(document.documentElement).getPropertyValue('--controls-h') || (pa && cs(pa).getPropertyValue('--controls-h')),
    plate: (() => { const p = document.getElementById('metaDetailOverlay'); return p && cs(p).display !== 'none' ? r(p) : null; })()
  };
  return JSON.stringify(out, null, 1);
})()

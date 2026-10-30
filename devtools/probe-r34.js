(async () => {
  // Measures the *painted* glyph box of each menu row icon, not the .btn-icon wrapper:
  // an emoji's advance width and an <svg>'s box differ, so wrapper geometry alone hides the
  // misalignment the user is seeing.
  const glyphRect = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(x => x.width > 0);
    if (!rects.length) return null;
    return rects.reduce((a, b) => ({
      left: Math.min(a.left, b.left),
      right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top),
      bottom: Math.max(a.bottom, b.bottom),
    }));
  };
  const fmt = (x) => x ? `${Math.round(x.left)},${Math.round(x.top)} ${Math.round(x.width)}x${Math.round(x.height)}` : 'none';

  const scan = (label, rows, iconSel, textSel) => {
    const out = [];
    for (const el of rows) {
      const icon = el.querySelector(iconSel);
      const text = el.querySelector(textSel);
      if (!icon || !text) continue;
      const g = glyphRect(icon);
      const t = glyphRect(text);
      out.push({
        id: el.id || el.dataset.context || text.textContent.trim().slice(0, 6),
        box: fmt(icon.getBoundingClientRect()),
        glyph: fmt(g),
        textLeft: t ? Math.round(t.left) : null,
        glyphCx: g ? +((g.left + g.right) / 2).toFixed(1) : null,
        glyphCy: g ? +((g.top + g.bottom) / 2).toFixed(1) : null,
        kind: icon.querySelector('svg') ? 'svg' : (/^\s*<svg/i.test(icon.innerHTML) ? 'svg-html' : 'text'),
      });
    }
    return { label, n: out.length, rows: out };
  };

  const res = {};
  res.viewport = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio };

  const appv = (typeof viewer !== 'undefined') ? viewer : null;
  if (appv) {
    appv.dom.headerRight.classList.add('active');
    document.body.classList.add('controls-visible');
  }
  await new Promise(r => setTimeout(r, 350));
  res.menu = scan('⋮ panel', [...document.querySelectorAll('.header-actions-group > *')],
    '.btn-icon', '.btn-text');

  document.querySelector('#cardContextMenu')?.classList.add('show');
  await new Promise(r => setTimeout(r, 200));
  res.ctx = scan('long-press', [...document.querySelectorAll('.card-context-menu .context-item')],
    '.context-icon', '.context-label');
  document.querySelector('#cardContextMenu')?.classList.remove('show');

  // Also the export sheet groups and the sidebar rows, same test.
  const dirBtns = [...document.querySelectorAll('.directory-item, .dir-entry, .browser-entry')].slice(0, 6);
  if (dirBtns.length) res.dir = scan('dir browser', dirBtns, '.btn-icon,.entry-icon,.icon', '.btn-text,.entry-name,.name');

  return JSON.stringify(res, null, 1);
})()

(async () => {
  // Generic "same-container icons must share a left edge / centre" checker: rather than guessing
  // which popup the user meant, walk every container that looks like a list of icon+label rows and
  // report the ones whose icon edges disagree by more than a pixel.
  const glyph = (el) => {
    const svg = el.querySelector('svg');
    if (svg) return svg.getBoundingClientRect();
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(x => x.width > 0.5);
    if (!rects.length) return null;
    return rects.reduce((a, b) => ({
      left: Math.min(a.left, b.left), right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom),
      width: 0, height: 0,
    }));
  };
  const ICON = '.btn-icon,.context-icon,.entry-icon,.icon,svg,i,.tab-icon';
  const vis = (el) => {
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05;
  };
  const seen = new Set();
  const reports = [];
  const candidates = [...document.querySelectorAll('body *')].filter(el => {
    if (el.children.length < 3 || el.children.length > 40) return false;
    if (!vis(el)) return false;
    const kids = [...el.children];
    return kids.every(k => vis(k) && k.querySelector(ICON) && k.getBoundingClientRect().height > 14);
  });
  for (const box of candidates) {
    const rows = [...box.children].map(k => {
      const icon = k.querySelector(ICON);
      const g = icon ? glyph(icon) : null;
      const label = [...k.querySelectorAll('span,div')].find(s => !s.contains(icon) && s.textContent.trim());
      const lg = label ? glyph(label) : null;
      if (!g || !lg) return null;
      return {
        t: (label.textContent || '').trim().slice(0, 10),
        il: +g.left.toFixed(1), ir: +g.right.toFixed(1),
        iy: +((g.top + g.bottom) / 2).toFixed(1),
        iw: +(g.right - g.left).toFixed(1),
        tl: +lg.left.toFixed(1), ty: +((lg.top + lg.bottom) / 2).toFixed(1),
      };
    }).filter(Boolean);
    if (rows.length < 3) continue;
    const spread = (vals, f) => +(Math.max(...vals.map(f)) - Math.min(...vals.map(f))).toFixed(1);
    const s = {
      iconLeft: spread(rows, r => r.il),
      iconWidth: spread(rows, r => r.iw),
      iconMidY: spread(rows, r => r.iy),
      textLeft: spread(rows, r => r.tl),
      textMidY: spread(rows, r => r.ty),
    };
    if (Math.max(s.iconLeft, s.iconWidth, s.iconMidY, s.textLeft) <= 1.2) continue;
    const path = (el => {
      const p = [];
      let n = el;
      while (n && n !== document.body && p.length < 3) {
        p.unshift(n.id ? `#${n.id}` : `.${[...n.classList].join('.')}`);
        n = n.parentElement;
      }
      return p.join(' > ');
    })(box);
    if (seen.has(path)) continue;
    seen.add(path);
    reports.push({ path, n: rows.length, s, rows });
  }
  reports.sort((a, b) => Math.max(...Object.values(b.s)) - Math.max(...Object.values(a.s)));
  return JSON.stringify({ viewport: { w: innerWidth, h: innerHeight }, n: reports.length, reports: reports.slice(0, 8) }, null, 1);
})()

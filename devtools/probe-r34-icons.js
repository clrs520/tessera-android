(async () => {
  // Settled-state geometry: the ⋮ panel rides a 0.2s opacity/transform transition, so measuring
  // right after opening reports the mid-flight scale (a 3px left shift at 0.98). Wait it out.
  const glyph = (el) => {
    const r = document.createRange();
    r.selectNodeContents(el);
    const rects = [...r.getClientRects()].filter(x => x.width > 0.5);
    if (!rects.length) return null;
    return rects.reduce((a, b) => ({
      left: Math.min(a.left, b.left), right: Math.max(a.right, b.right),
      top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom),
    }));
  };
  const open = async (sel, ms = 450) => {
    document.querySelector(sel)?.classList.add('active', 'show');
    await new Promise(r => setTimeout(r, ms));
  };
  const rows = [];
  const scan = (label, nodes, iconSel, textSel) => {
    for (const el of nodes) {
      const icon = el.querySelector(iconSel);
      const text = el.querySelector(textSel);
      if (!icon || !text) continue;
      const b = el.getBoundingClientRect();
      const g = glyph(icon);
      const t = glyph(text);
      if (!g || !t) continue;
      rows.push({
        panel: label,
        id: el.id || el.dataset.context || text.textContent.trim().slice(0, 8),
        kind: icon.querySelector('svg') ? 'svg' : 'text',
        // everything below is relative to the row's own padding box, so a shifted row is
        // visible as an outlier rather than as a different absolute x
        iconL: +(g.left - b.left).toFixed(1),
        iconW: +(g.right - g.left).toFixed(1),
        iconMidY: +(((g.top + g.bottom) / 2) - b.top).toFixed(1),
        textL: +(t.left - b.left).toFixed(1),
        textMidY: +(((t.top + t.bottom) / 2) - b.top).toFixed(1),
        rowH: +b.height.toFixed(1),
      });
    }
  };

  const appv = (typeof viewer !== 'undefined') ? viewer : null;
  if (appv) appv.dom.headerRight.classList.add('active');
  await open('.header-collapsed .header-actions-group', 500);
  scan('more', [...document.querySelectorAll('.header-actions-group > button, .header-actions-group > a')], '.btn-icon', '.btn-text');

  const ctx = document.getElementById('cardContextMenu');
  if (ctx) { ctx.classList.add('show'); await new Promise(r => setTimeout(r, 350)); }
  scan('ctx', [...document.querySelectorAll('.card-context-menu .context-item')], '.context-icon', '.context-label');
  if (ctx) ctx.classList.remove('show');

  // The export sheet's rows and the layout picker, same test where they carry an icon+label pair.
  scan('dir', [...document.querySelectorAll('.directory-entry, .dir-entry, .browser-entry, .recent-dir-item')].slice(0, 8), '.btn-icon,.entry-icon,.icon', '.btn-text,.entry-name,.name');

  const byPanel = {};
  for (const r of rows) (byPanel[r.panel] ||= []).push(r);
  const summary = Object.entries(byPanel).map(([p, rs]) => {
    const med = (k) => { const a = rs.map(x => x[k]).sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
    const m = { iconL: med('iconL'), textL: med('textL'), iconMidY: med('iconMidY'), textMidY: med('textMidY') };
    return {
      panel: p, n: rs.length, median: m,
      outliers: rs.filter(r => Math.abs(r.iconL - m.iconL) > 1 || Math.abs(r.textL - m.textL) > 1.5
        || Math.abs(r.iconMidY - m.iconMidY) > 1 || Math.abs(r.textMidY - m.textMidY) > 1.5
        || Math.abs(r.iconW - med('iconW')) > 1.5).map(r => ({ ...r, iconWmed: med('iconW') })),
    };
  });
  return JSON.stringify({ viewport: { w: innerWidth, h: innerHeight }, all: rows, summary }, null, 1);
})()

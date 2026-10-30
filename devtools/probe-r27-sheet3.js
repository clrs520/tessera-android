(() => {
  const R = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: cs.zIndex, op: cs.opacity }; };
  const ov = (a, b) => { if (!a || !b) return 0; const w = Math.min(a.x+a.w, b.x+b.w) - Math.max(a.x, b.x);
    const h = Math.min(a.y+a.h, b.y+b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 ? Math.round(w*h) : 0; };
  const sheet = document.querySelector('.phone-tab-sheet, #phoneTabSheet, .tab-sheet, .phone-more-sheet') ||
    [...document.querySelectorAll('div')].find(d => /sheet|tab-panel|more-panel/.test(d.className) && getComputedStyle(d).display !== 'none' && d.getBoundingClientRect().height > 40);
  const plate = document.getElementById('metaDetailOverlay');
  const hud = document.getElementById('metadataPanel');
  const bar = document.querySelector('.phone-action-bar');
  const p = R(plate), s = R(sheet), h = R(hud), b = R(bar);
  return JSON.stringify({
    vp: [innerWidth, innerHeight],
    sheetCls: sheet ? sheet.className : null, sheet: s, plate: p, hud: h, bar: b,
    plateShown: !!p, sheetOccludedPx: ov(s, p), hudOverPlatePx: ov(h, p), sheetOverBarPx: ov(s, b),
    hudCollapsed: hud.classList.contains('collapsed'),
    hitInSheet: s ? [...sheet.querySelectorAll('button')].map(e2 => { const r = e2.getBoundingClientRect(); const c2 = getComputedStyle(e2);
        if (c2.display === 'none' || r.width === 0) return null;
        const top = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
        return { t: (e2.textContent||'').trim().slice(0,8), reachable: !!(top && (top === e2 || e2.contains(top) || top.contains(e2))) }; })
      .filter(Boolean) : null,
  }, null, 1);
})()

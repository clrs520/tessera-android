(() => {
  const ids = ['metaSwitchBtn', 'metaDetailBtn', 'exportCSVBtn', 'revealFileBtn', 'downloadFileBtn', 'snapshotBtn'];
  const r = {};
  const hr = document.querySelector('.header-right');
  r.hrCls = hr ? hr.className : 'MISSING';
  const group = document.getElementById('headerActionsGroup');
  if (group) {
    const gs = getComputedStyle(group);
    r.group = { cls: group.className, pe: gs.pointerEvents, vis: gs.visibility, op: gs.opacity, disp: gs.display, ov: gs.overflow, ovY: gs.overflowY };
    const gr = group.getBoundingClientRect();
    r.groupRect = [Math.round(gr.left), Math.round(gr.top), Math.round(gr.width), Math.round(gr.height)];
  }
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) { r[id] = 'MISSING'; return; }
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const pts = [
      ['c', b.left + b.width / 2, b.top + b.height / 2],
      ['l', b.left + 6, b.top + b.height / 2],
      ['rr', b.right - 6, b.top + b.height / 2],
      ['t', b.left + b.width / 2, b.top + 6]
    ];
    r[id] = {
      pe: cs.pointerEvents, vis: cs.visibility, op: cs.opacity, disp: cs.display,
      disabled: !!el.disabled, rect: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
      hits: pts.map(p => {
        const e = document.elementFromPoint(p[1], p[2]);
        return p[0] + ':' + (e ? (e.id || e.tagName + '.' + String(e.className).slice(0, 40)) : 'null');
      }).join(' ')
    };
  });
  const plate = document.getElementById('metadataPanelOverlay') || document.querySelector('.stats-overlay');
  if (plate) {
    const ps = getComputedStyle(plate);
    const pr = plate.getBoundingClientRect();
    r.plate = { cls: plate.className, z: ps.zIndex, pe: ps.pointerEvents, vis: ps.visibility,
      rect: [Math.round(pr.left), Math.round(pr.top), Math.round(pr.width), Math.round(pr.height)] };
  }
  return JSON.stringify(r, null, 1);
})()

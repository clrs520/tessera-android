(() => {
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => el ? getComputedStyle(el) : null;
  const header = document.querySelector('.main-header');
  const hr = document.getElementById('headerRight');
  const g = document.getElementById('headerActionsGroup');
  const overlay = document.getElementById('videoControlsOverlay');
  const plate = document.getElementById('metaDetailOverlay');
  const vs = document.getElementById('viewSwitcher');
  const b = g.querySelector('button');
  const br = b.getBoundingClientRect();
  return JSON.stringify({
    header: { rect: r(header), z: cs(header).zIndex, pos: cs(header).position, cls: header.className },
    headerRight: { cls: hr.className, z: cs(hr).zIndex, pos: cs(hr).position, rect: r(hr) },
    group: { rect: r(g), z: cs(g).zIndex, pos: cs(g).position },
    firstRow: { id: b.id, rect: r(b), z: cs(b).zIndex },
    overlay: { rect: r(overlay), z: cs(overlay).zIndex, pe: cs(overlay).pointerEvents, vis: cs(overlay).visibility, op: cs(overlay).opacity, cls: overlay.className },
    viewSwitcher: { rect: r(vs), z: cs(vs).zIndex, pe: cs(vs).pointerEvents },
    plate: { rect: r(plate), z: cs(plate).zIndex, d: cs(plate).display },
    hasSelectorWorks: (() => { try { return !!document.querySelector('.main-header:has(.header-right.active)'); } catch (e) { return 'unsupported: ' + e.message; } })(),
  }, null, 1);
})()

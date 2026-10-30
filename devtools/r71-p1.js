// R71 probe: portrait, non-fullscreen, top header row — what is in it, how wide it wants to be,
// what is truncated, and what overlaps what.
(async () => {
  const out = { steps: [] };
  const hdr = document.querySelector('.main-header');
  if (!hdr || !window.viewer) { out.err = 'no header/viewer'; return JSON.stringify(out); }
  out.vp = [Math.round(innerWidth), Math.round(innerHeight)];
  out.fs = document.body.classList.contains('phone-fullscreen');
  out.ev = window.viewer.currentEvent ? window.viewer.currentEvent.eventId : null;

  const box = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
  };
  const info = (el, name) => {
    const cs = getComputedStyle(el);
    const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
    return {
      name, box: box(el),
      w: Math.round(el.getBoundingClientRect().width),
      scrollW: el.scrollWidth, clientW: el.clientWidth,
      clipped: el.scrollWidth > el.clientWidth + 1,
      display: cs.display, shrink: cs.flexShrink, basis: cs.flexBasis, pos: cs.position,
      fs: cs.fontSize, nowrap: cs.whiteSpace, opa: cs.opacity, vis: cs.visibility,
      txt: txt.length > 46 ? txt.slice(0, 46) + '…' : txt
    };
  };
  const kids = ['.header-left', '#headerEventName', '.header-center-info', '#headerLocationDisplay',
                '#realTimeClock', '.header-right'];
  const rows = [];
  for (const sel of kids) {
    const el = sel.startsWith('#') ? document.getElementById(sel.slice(1)) : document.querySelector(sel);
    if (!el) { rows.push({ name: sel, missing: true }); continue; }
    rows.push(info(el, sel));
  }
  out.rows = rows;
  out.headerBox = box(hdr);
  out.headerH = Math.round(hdr.getBoundingClientRect().height);

  // pairwise horizontal overlap between the three *visible* content boxes
  const vis = rows.filter(r => !r.missing && r.box[2] > 0 && r.display !== 'none' && r.vis !== 'hidden' && r.opa !== '0');
  const ov = (a, b) => {
    const x = Math.min(a.box[0] + a.box[2], b.box[0] + b.box[2]) - Math.max(a.box[0], b.box[0]);
    const y = Math.min(a.box[1] + a.box[3], b.box[1] + b.box[3]) - Math.max(a.box[1], b.box[1]);
    return (x > 0 && y > 0) ? Math.round(x) : 0;
  };
  const names = { '.header-left': 'left', '#headerEventName': 'event', '.header-center-info': 'center',
                  '#headerLocationDisplay': 'loc', '#realTimeClock': 'clock', '.header-right': 'right' };
  const groups = [['#headerEventName', '#headerLocationDisplay'], ['#headerEventName', '#realTimeClock'],
                  ['.header-left', '.header-center-info'], ['.header-center-info', '.header-right'],
                  ['#headerLocationDisplay', '#realTimeClock']];
  for (const [a, b] of groups) {
    const ra = vis.find(r => r.name === a), rb = vis.find(r => r.name === b);
    if (ra && rb) out.steps.push(`${names[a]}×${names[b]} overlap=${ov(ra, rb)}px gap=${Math.round(rb.box[0] - (ra.box[0] + ra.box[2]))}px`);
  }
  out.clippedNames = rows.filter(r => r.clipped).map(r => `${names[r.name] || r.name}(${r.scrollW}>${r.clientW})`);
  out.totalNeeded = rows.filter(r => !r.missing).map(r => `${names[r.name] || r.name}:${r.w}`).join(' ');
  return JSON.stringify(out, null, 1);
})()

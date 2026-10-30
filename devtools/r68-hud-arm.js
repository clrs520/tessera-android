// R68 phase-1 instrumentation: sample the 行车数据 HUD card every animation frame across a
// rotation, so the "briefly huge" frame is a measurement instead of a guess.
// Returns immediately; read with r68-hud-read.js after the rotation.
(() => {
  const p = document.getElementById('metadataPanel');
  if (!p) return 'NO_PANEL';
  if (!window.viewer) return 'DEAD_PAGE';

  const MQ = {
    land: '(orientation: landscape) and (max-height: 620px) and (max-width: 1200px)',
    narrow: '(max-width: 768px)',
    coarse: '(hover: none) and (pointer: coarse)',
    portrait: '(orientation: portrait)'
  };
  const trace = [];
  const marks = [];
  const t0 = performance.now();

  const snap = () => {
    if (trace.length >= 200) return;
    const r = p.getBoundingClientRect();
    const par = p.parentElement ? p.parentElement.getBoundingClientRect() : null;
    const cs = getComputedStyle(p);
    const cc = getComputedStyle(p.querySelector('.metadata-content') || p);
    const cd = getComputedStyle(p.querySelector('.metadata-dashboard') || p);
    trace.push({
      t: Math.round(performance.now() - t0),
      vw: window.innerWidth, vh: window.innerHeight,
      dpr: Math.round(window.devicePixelRatio * 100) / 100,
      panel: [Math.round(r.width), Math.round(r.height), Math.round(r.left), Math.round(r.top)],
      parent: par ? [Math.round(par.width), Math.round(par.height)] : null,
      cls: p.className,
      inline: `${p.style.left || '-'} ${p.style.top || '-'} ${p.style.width || '-'}`,
      mqn: [matchMedia(MQ.land).matches, matchMedia(MQ.narrow).matches,
            matchMedia(MQ.coarse).matches, matchMedia(MQ.portrait).matches].join(''),
      pos: cs.position + '/' + cs.top.slice(0, 9) + '/' + cs.left.slice(0, 9) + '/' + cs.right.slice(0, 9) + '/' + cs.bottom.slice(0, 9),
      maxw: cs.maxWidth, w: cs.width,
      fd: cc.flexDirection + '/' + cd.flexDirection,
      vis: cs.visibility + '/' + cs.opacity,
      items: p.querySelectorAll('.metadata-item').length,
      rows: p.querySelectorAll('.metadata-secondary').length
    });
  };

  const tick = () => {
    snap();
    if (trace.length < 200 && performance.now() - t0 < 6000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const mark = (kind) => marks.push({ kind, t: Math.round(performance.now() - t0), vw: window.innerWidth, vh: window.innerHeight });
  window.addEventListener('resize', () => mark('resize'));
  window.addEventListener('orientationchange', () => mark('orient'));
  window.__hudMarks = marks;
  window.__hudTrace = trace;
  return 'ARMED ' + window.innerWidth + 'x' + window.innerHeight;
})()

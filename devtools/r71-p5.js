// R71 p5: re-measure the top row on the shipped build, then reproduce the pre-fix squeeze
// inside the same page (old flex rules + the old full-stamp clock text) so the 「改之前」
// column in the doc is a fresh measurement, not a remembered number.
(async () => {
  const out = {};
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  if (document.querySelector('.player-area')?.classList.contains('empty')) return JSON.stringify({ err: 'no event' });

  const hdr = document.querySelector('.main-header');
  const ids = {
    left: '.header-left', event: '#headerEventName', center: '.header-center-info',
    loc: '#headerLocationDisplay', clock: '#realTimeClock', right: '.header-right'
  };
  const read = () => {
    const r = {};
    for (const k in ids) {
      const el = document.querySelector(ids[k]);
      const b = el.getBoundingClientRect();
      r[k] = {
        l: Math.round(b.left), w: Math.round(b.width), r: Math.round(b.right),
        sw: el.scrollWidth, cw: el.clientWidth,
        clipped: el.scrollWidth > el.clientWidth + 1,
        txt: (el.textContent || '').trim().replace(/\s+/g, ' ')
      };
    }
    r.contentW = Math.round(hdr.clientWidth - parseFloat(getComputedStyle(hdr).paddingLeft) - parseFloat(getComputedStyle(hdr).paddingRight));
    r.hdrH = Math.round(hdr.getBoundingClientRect().height);
    r.gapEventLoc = r.loc.l - r.event.r;
    r.gapLocClock = r.clock.l - r.loc.r;
    r.rightEdge = Math.max(r.event.r, r.clock.r);
    return r;
  };

  v.videoControls.updateRealTimeClock();
  out.after = read();

  // --- reproduce the pre-fix layout ---------------------------------------
  const st = document.createElement('style');
  st.id = 'r71-prefix';
  st.textContent = `
    .main-header .header-left { flex: 0 0 auto !important; min-width: 0 !important; }
    .main-header .header-center-info { flex: 1 1 auto !important; min-width: 0 !important; }
    .main-header .header-location { max-width: none !important; }
  `;
  document.head.appendChild(st);
  // The only thing the old clock did differently was spend ~114 px on a date nobody needed.
  const vc = v.videoControls, cp = v.continuousPlayer, el = document.getElementById('realTimeClock');
  const pad = n => String(n).padStart(2, '0');
  const nt = new Date(vc.currentEventStartTime.getTime());
  nt.setSeconds(nt.getSeconds() + cp.getCurrentTime());
  el.textContent = `${nt.getFullYear()}-${pad(nt.getMonth() + 1)}-${pad(nt.getDate())} ${pad(nt.getHours())}:${pad(nt.getMinutes())}:${pad(nt.getSeconds())}`;
  out.before = read();
  out.before.needsW = out.before.event.w + out.before.loc.sw + out.before.clock.w + 22;

  document.getElementById('r71-prefix').remove();
  vc.updateRealTimeClock();
  out.restored = el.textContent.trim();
  return JSON.stringify(out, null, 1);
})()

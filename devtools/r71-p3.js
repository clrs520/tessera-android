// R71 post-install verification. Everything here reads real behaviour, not flags:
// the clock text comes from updateRealTimeClock(), the widths from live layout boxes.
(async () => {
  const out = { steps: [] };
  const v = window.viewer;
  if (!v) { out.err = 'no viewer'; return JSON.stringify(out); }
  if (document.querySelector('.player-area')?.classList.contains('empty')) {
    out.err = 'no event loaded (player-area empty)'; return JSON.stringify(out);
  }
  out.vp = [Math.round(innerWidth), Math.round(innerHeight)];
  out.fs = document.body.classList.contains('phone-fullscreen');
  out.ev = v.currentEvent ? v.currentEvent.eventId : null;

  const vc = v.videoControls;
  const clk = document.getElementById('realTimeClock');
  const loc = document.getElementById('headerLocationDisplay');
  const chip = document.getElementById('headerEventName');
  const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const clip = (el) => el.scrollWidth > el.clientWidth + 1;
  const snap = (name) => ({
    name,
    clock: clk.textContent.trim(),
    chip: { w: Math.round(chip.getBoundingClientRect().width), txt: chip.textContent.trim(), clipped: clip(chip) },
    loc: { w: Math.round(loc.getBoundingClientRect().width), need: loc.scrollWidth, txt: loc.textContent.trim(), clipped: clip(loc) },
    rightEdge: Math.round(clk.getBoundingClientRect().right),
    slack: Math.round(innerWidth - clk.getBoundingClientRect().right),
    overlap: Math.round(loc.getBoundingClientRect().left - chip.getBoundingClientRect().right),
    headerH: Math.round(document.querySelector('.main-header').getBoundingClientRect().height)
  });

  const forceClock = () => vc.updateRealTimeClock();

  // 0. positive baseline — refuse to report anything if the fixture has no clock at all
  forceClock();
  if (!/\d\d:\d\d:\d\d/.test(clk.textContent)) {
    out.err = 'clock not populated, baseline invalid'; out.raw = clk.textContent;
    return JSON.stringify(out);
  }
  out.steps.push(snap('phone, same day'));

  // 1. cross midnight: the event starts 10 s before midnight and the playhead is pinned at
  //    13 s, so base+elapsed really does land on the next day. (Shifting only the base is an
  //    invalid test — newTime is derived *from* the base, so both sides of the same-day
  //    comparison move together and the date can never come back.)
  const real = vc.currentEventStartTime;
  const cp = v.continuousPlayer;
  const wasOwn = Object.prototype.hasOwnProperty.call(cp, 'getCurrentTime');
  const realNow = cp.getCurrentTime;
  cp.getCurrentTime = function () { return 13; };
  vc.currentEventStartTime = new Date(real.getFullYear(), real.getMonth(), real.getDate(), 23, 59, 50);
  forceClock();
  out.steps.push(snap('phone, crossed midnight'));
  out.midnightHasDate = /^\d\d-\d\d \d\d:\d\d:\d\d$/.test(clk.textContent.trim());
  if (wasOwn) cp.getCurrentTime = realNow; else delete cp.getCurrentTime;
  vc.currentEventStartTime = real;
  forceClock();

  // 2. no phone shell → the dated stamp must survive (desktop behaviour untouched)
  const realIsPhone = window.isPhoneLayout;
  window.isPhoneLayout = () => false;
  forceClock();
  out.steps.push(snap('isPhoneLayout()=false'));
  out.desktopKeepsDate = /^\d{4}-\d\d-\d\d/.test(clk.textContent.trim());
  window.isPhoneLayout = realIsPhone;
  forceClock();
  out.rebound = typeof window.isPhoneLayout === 'function';

  // 3. English strings — the chip is wider there, check the row still fits
  const rl = v.currentLanguage;
  v.currentLanguage = 'en';
  v.setHeaderEventName(v.currentEvent);
  forceClock();
  out.steps.push(snap('en'));
  v.currentLanguage = rl;
  v.setHeaderEventName(v.currentEvent);
  forceClock();

  // 4. long address: the chip must yield, the address must not lose its street first
  const html = loc.innerHTML;
  loc.innerHTML = '📍 <span class="city-text">杭州市 · 文三路 与 教工路 交叉口 往东 200 米</span>';
  out.steps.push(snap('long address'));
  out.chipYieldedFirst = chip.getBoundingClientRect().width < 158;
  loc.innerHTML = html;

  // 5. live: does the seconds tick while playing (i.e. the format survives the ticker)?
  out.clockBeforeTick = clk.textContent.trim();
  return JSON.stringify(out, null, 1);
})()

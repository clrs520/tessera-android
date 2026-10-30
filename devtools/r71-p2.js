// R71 pre-build check: inject the new header rules + the new clock string, then measure three
// scenarios. Nothing here is a fix — it only tells me whether the CSS/JS I just wrote lands.
(async () => {
  const out = { scenarios: [] };
  const v = window.viewer;
  if (!v) { out.err = 'no viewer'; return JSON.stringify(out); }
  const hdr = document.querySelector('.main-header');
  if (!hdr) { out.err = 'no header'; return JSON.stringify(out); }
  if (document.querySelector('.player-area')?.classList.contains('empty')) {
    out.err = 'no event loaded'; return JSON.stringify(out);
  }

  const st = document.createElement('style');
  st.id = '__r71inj';
  st.textContent = `
    .header-left { flex: 0 1 auto !important; min-width: 64px !important; }
    .header-center-info { flex: 0 0 auto !important; min-width: auto !important; }
    .header-location { max-width: 46vw !important; }
    .header-event-name { min-width: 0 !important; }`;
  document.head.appendChild(st);

  const loc = document.getElementById('headerLocationDisplay');
  const clk = document.getElementById('realTimeClock');
  const chip = document.getElementById('headerEventName');
  const locHTML = loc.innerHTML;
  const chipText = chip.textContent;

  const box = (el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const snap = (name) => {
    const b = (el) => box(el);
    const clip = (el) => el.scrollWidth > el.clientWidth + 1;
    const right = Math.max(b(clk)[0] + b(clk)[2], b(loc)[0] + b(loc)[2]);
    return {
      name,
      chip: { box: b(chip), txt: chip.textContent, clipped: clip(chip) },
      loc: { box: b(loc), txt: loc.textContent.trim(), need: loc.scrollWidth, got: loc.clientWidth, clipped: clip(loc) },
      clock: { box: b(clk), txt: clk.textContent.trim(), clipped: clip(clk) },
      rowRightEdge: right, slack: Math.round(innerWidth - right),
      overlapChipLoc: Math.round((b(loc)[0]) - (b(chip)[0] + b(chip)[2]))
    };
  };

  // 1. today's data, new clock format
  clk.textContent = '07:32:00';
  chip.textContent = '💾 保存片段 10-08 07:30';
  out.scenarios.push(snap('normal (time-only clock)'));

  // 2. a long street — the address must stay whole, the chip must yield
  loc.innerHTML = '📍 <span class="city-text">杭州市 · 文三路 与 教工路 交叉口 往东 200 米</span>';
  out.scenarios.push(snap('long address'));

  // 3. worst case: long address AND the date back on the clock (crossed midnight)
  clk.textContent = '10-09 00:04:11';
  out.scenarios.push(snap('long address + dated clock'));

  // restore
  loc.innerHTML = locHTML;
  clk.textContent = '07:32:00';
  chip.textContent = chipText;
  st.remove();
  out.restored = !document.getElementById('__r71inj');
  out.vp = [Math.round(innerWidth), Math.round(innerHeight)];
  return JSON.stringify(out, null, 1);
})()

// Round-15 verification against the installed 1.1.5 build (no CSS injection this time):
// partial-acceleration metadata must not throw, portrait tiles must keep the frame ratio, the
// ⋮ panel must stay clickable over the 行车数据 HUD, and a real crash must report its line.
//
//   node devtools/probe-r15-verify.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const mode = process.argv[2] === 'load' ? 'load' : 'measure';

const expr = `(async () => {
  const out = { vp: innerWidth + 'x' + innerHeight, version: (document.getElementById('appVersion') || {}).textContent };
  const overlay = Object.values(window.viewer).find(v => v && typeof v.updateStatsDisplay === 'function');
  out.overlayFound = !!overlay;

  // 1. The reported crash: a frame carrying X but no Y/Z.
  let threw = null;
  try {
    overlay.updateStatsDisplay({ vehicleSpeedMps: 3.5, gearState: 'GEAR_DRIVE', linearAccelerationMps2X: 1.234 });
  } catch (e) {
    threw = e.message;
  }
  out.partialAccel = { threw, accel: overlay.dom.stats.accel.textContent };

  let threw2 = null;
  try {
    overlay.updateStatsDisplay({ linearAccelerationMps2X: 1, linearAccelerationMps2Y: 2, linearAccelerationMps2Z: 3 });
  } catch (e) {
    threw2 = e.message;
  }
  out.fullAccel = { threw: threw2, accel: overlay.dom.stats.accel.textContent };

  // 2. Tiles need a loaded event. playEvent runs calculateEventDurations for ~15s, which is
  //    longer than the CDP round trip, so kick it off and measure on a second run.
  if (!window.viewer.currentEvent) {
    if ('${mode}' === 'load') {
      window.viewer.loadTauriDirectory('/storage/emulated/0/TeslaCam')
        .then(() => window.viewer.playEvent(window.viewer.lastFilteredEvents[0].eventId));
      return JSON.stringify({ loading: true });
    }
    return JSON.stringify({ ...out, waiting: 'run: node devtools/probe-r15-verify.mjs load, then measure' });
  }
  out.event = window.viewer.currentEvent ? window.viewer.currentEvent.eventId : 'none';

  const player = window.viewer.multiCameraPlayer;
  const area = document.querySelector('.player-area');
  const box = (el) => Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height)
      + '@' + Math.round(el.getBoundingClientRect().top);
  const tiles = () => Array.from(area.querySelectorAll(':scope > .video-container'))
      .filter(el => getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'))
      .map(el => el.dataset.camera + ' ' + box(el) + ' fit ' + getComputedStyle(el.querySelector('video')).objectFit);
  out.layouts = {};
  out.bottoms = {};
  const start = player.layoutMode;
  for (const name of ['grid4', 'grid', 'legacy']) {
    player.layoutMode = name;
    player.updateLayout();
    out.layouts[name] = tiles();
    const visible = Array.from(area.querySelectorAll(':scope > .video-container'))
        .filter(el => getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'));
    out.bottoms[name] = Math.round(Math.max(...visible.map(el => el.getBoundingClientRect().bottom)));
  }
  const overlayTop = document.querySelector('.video-controls-overlay').getBoundingClientRect().top;
  out.hudClear = { overlayTop: Math.round(overlayTop), controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim() };
  player.layoutMode = start;
  player.updateLayout();

  // 3. ⋮ panel over the HUD: the last row must still hit-test inside the panel.
  document.getElementById('metadataPanel').classList.remove('collapsed');
  document.getElementById('tabMoreBtn').click();
  await new Promise(r => setTimeout(r, 350));
  const menu = document.querySelector('.header-actions-group');
  const rows = Array.from(menu.querySelectorAll('button, a'));
  const last = rows[rows.length - 1].getBoundingClientRect();
  const hit = document.elementFromPoint(Math.round(last.left + last.width / 2), Math.round(last.top + last.height / 2));
  out.menu = {
    headerZ: getComputedStyle(document.querySelector('.main-header')).zIndex,
    rows: rows.length,
    panel: box(menu),
    scroll: menu.scrollHeight + '/' + menu.clientHeight,
    hit: hit ? hit.tagName + '.' + (hit.getAttribute('class') || '') : 'null',
    insideMenu: menu.contains(hit),
  };
  rows[1].click();  // 详细数据
  await new Promise(r => setTimeout(r, 250));
  const stats = document.querySelector('.stats-overlay');
  const sr = stats.getBoundingClientRect();
  out.stats = {
    box: Math.round(sr.width) + 'x' + Math.round(sr.height) + '@' + Math.round(sr.top),
    headerBottom: Math.round(document.querySelector('.main-header').getBoundingClientRect().bottom),
    label: getComputedStyle(stats.querySelector('.stats-label')).color,
    value: getComputedStyle(stats.querySelector('.stats-value')).color,
    bg: getComputedStyle(stats).backgroundColor,
    accel: overlay.dom.stats.accel.textContent,
    dark: document.body.classList.contains('dark-theme'),
  };

  // 4. A genuine crash has to carry a source position now.
  setTimeout(() => { overlay.updateStatsDisplay(undefined); }, 0);
  await new Promise(r => setTimeout(r, 400));
  out.banner = {
    shown: document.getElementById('jsErrorBanner').style.display,
    text: document.getElementById('jsErrorText').textContent.slice(0, 120),
  };
  return JSON.stringify(out, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r15-verify.js`;
writeFileSync(tmp, expr, 'utf8');
console.log(execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', tmp], { encoding: 'utf8', timeout: 120000 }));

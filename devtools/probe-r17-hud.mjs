// Round 17 preview: inject the *current* styles.css into the running app and measure the
// driving-data card against the 16:9 picture band in both orientations.
//
//   node devtools/probe-r17-hud.mjs            # portrait
//   node devtools/probe-r17-hud.mjs landscape  # landscape
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const css = readFileSync(`${root}/TDashcamStudio/src/styles.css`, 'utf8');
const landscape = process.argv.includes('landscape');

const expr = `(async () => {
  document.getElementById('r17-live')?.remove();
  const style = document.createElement('style');
  style.id = 'r17-live';
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);

  viewer.multiCameraPlayer.setLayout('single');
  const panel = document.getElementById('metadataPanel');
  panel.classList.remove('collapsed');
  // No SEI metadata in this session, so the manager keeps #metadataItems hidden; force the real
  // dashboard back in to measure the card as it looks during playback.
  document.getElementById('metadataEmpty').style.display = 'none';
  document.getElementById('metadataLoading').style.display = 'none';
  document.getElementById('metadataItems').style.display = 'flex';
  const gear = panel.querySelector('.meta-gear');
  if (gear) gear.textContent = 'D';
  const speed = document.getElementById('metaSpeed');
  if (speed) speed.textContent = '63';
  await new Promise(r => setTimeout(r, 600));

  const box = el => {
    const r = el.getBoundingClientRect();
    return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top);
  };
  const area = document.querySelector('.player-area').getBoundingClientRect();
  const feed = document.querySelector('.player-area video').getBoundingClientRect();
  const picW = Math.min(feed.width, feed.height * 16 / 9);
  const picH = Math.min(feed.height, feed.width * 9 / 16);
  const pic = {
    left: Math.round(feed.x + (feed.width - picW) / 2),
    right: Math.round(feed.x + (feed.width + picW) / 2),
    top: Math.round(feed.y + (feed.height - picH) / 2),
    bottom: Math.round(feed.y + (feed.height + picH) / 2),
  };
  const p = panel.getBoundingClientRect();
  const overlap = !(p.right <= pic.left || p.left >= pic.right || p.bottom <= pic.top || p.top >= pic.bottom);
  return JSON.stringify({
    vp: innerWidth + 'x' + innerHeight,
    area: box(document.querySelector('.player-area')),
    feed: box(document.querySelector('.player-area video')),
    pictureBandX: pic.left + '..' + pic.right,
    pictureBandY: pic.top + '..' + pic.bottom,
    panel: box(panel),
    panelMaxWidth: getComputedStyle(panel).maxWidth,
    dashboard: box(document.querySelector('.metadata-dashboard')),
    overlapsPicture: overlap,
    controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h'),
    metaBottom: getComputedStyle(document.documentElement).getPropertyValue('--meta-bottom'),
  }, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r17-page.js`;
writeFileSync(tmp, expr);
console.log(execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', tmp], { encoding: 'utf8' }));

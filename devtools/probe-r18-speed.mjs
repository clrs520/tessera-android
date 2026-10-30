// Round 18: does the speed picker stay on screen and above the driving-data card?
// The *current* styles.css is injected into the running page, so these numbers come from the
// real rules — verify before spending a build.
//
//   node devtools/probe-r18-speed.mjs            # portrait
//   node devtools/probe-r18-speed.mjs landscape  # landscape
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const css = readFileSync(`${root}/TDashcamStudio/src/styles.css`, 'utf8');
const landscape = process.argv.includes('landscape');

const expr = `(async () => {
  document.getElementById('r18-live')?.remove();
  const style = document.createElement('style');
  style.id = 'r18-live';
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
  await new Promise(r => requestAnimationFrame(r));

  const ctrl = document.getElementById('speedControl');
  const btn = document.getElementById('speedBtn');
  const opts = document.querySelector('.speed-options');
  const panel = document.querySelector('.metadata-panel');
  const overlay = document.querySelector('.video-controls-overlay');

  if (window.viewer?.multiCameraPlayer) window.viewer.multiCameraPlayer.setLayout('single');
  if (panel) { panel.classList.remove('collapsed'); panel.style.display = 'flex'; }
  const items = document.getElementById('metadataItems');
  if (items) items.style.setProperty('display', 'flex', 'important');
  ctrl.classList.add('active');
  await new Promise(r => requestAnimationFrame(r));

  const b = btn.getBoundingClientRect();
  const o = opts.getBoundingClientRect();
  const rows = [...opts.querySelectorAll('div')].map(d => {
    const r = d.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      label: d.textContent,
      box: Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top),
      hit: el ? (el.id || el.className || el.tagName).toString().slice(0, 30) : 'null',
      clickable: !!(el && d.contains(el)),
    };
  });

  const out = {
    landscape: ${JSON.stringify(landscape)},
    viewport: Math.round(innerWidth) + 'x' + Math.round(innerHeight),
    button: Math.round(b.width) + 'x' + Math.round(b.height) + '@' + Math.round(b.left) + ',' + Math.round(b.top),
    menu: Math.round(o.width) + 'x' + Math.round(o.height) + '@' + Math.round(o.left) + ',' + Math.round(o.top),
    offRightEdge: Math.round(o.right) - Math.round(innerWidth),
    offLeftEdge: Math.round(innerWidth - o.left) < innerWidth ? Math.round(o.left) : 0,
    overlayZWhileOpen: getComputedStyle(overlay).zIndex,
    panelZ: getComputedStyle(panel).zIndex,
    panelBox: (() => { const r = panel.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top); })(),
    rows,
    verdict: {
      insideViewport: o.left >= 0 && o.right <= innerWidth,
      allRowsReachable: rows.every(r => r.clickable),
      rowsAtLeast40: rows.every(r => parseInt(r.box.split('x')[1]) >= 40),
    },
  };
  ctrl.classList.remove('active');
  return JSON.stringify(out, null, 1);
})()`;

const page = `${root}/devtools/.probe-r18-page.js`;
writeFileSync(page, expr);
const out = execFileSync('node', [`${root}/devtools/cdp-eval.mjs`, '--file', page], { encoding: 'utf8' });
console.log(out);

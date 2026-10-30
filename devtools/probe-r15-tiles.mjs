// Measure the round-15 tile/menu/stats geometry against the *current* styles.css, hot-injected
// into the running 1.1.4 page, so the numbers come from the real rules and not a hand-copied
// subset. Run from the workspace root:
//
//   node devtools/probe-r15-tiles.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const css = readFileSync(`${root}/TDashcamStudio/src/styles.css`, 'utf8');

const expr = `(() => {
  const css = ${JSON.stringify(css)};
  let style = document.getElementById('r15-live');
  if (!style) { style = document.createElement('style'); style.id = 'r15-live'; document.head.appendChild(style); }
  style.textContent = css;

  const area = document.querySelector('.player-area');
  const player = window.viewer.multiCameraPlayer;
  const setLayout = (name) => {
    player.layoutMode = name;
    player.updateLayout();
  };
  const box = (el) => {
    if (!el) return 'null';
    const r = el.getBoundingClientRect();
    return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top) + ',' + Math.round(r.left);
  };
  const tiles = () => Array.from(area.querySelectorAll(':scope > .video-container'))
    .filter(el => getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden'))
    .map(el => {
      const cam = el.dataset.camera;
      const v = el.querySelector('video');
      const r = el.getBoundingClientRect();
      const vr = v ? v.getBoundingClientRect() : null;
      return cam + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top)
          + (vr ? ' video ' + Math.round(vr.width) + 'x' + Math.round(vr.height) : '');
    });
  const chrome = () => {
    const ov = document.querySelector('.video-controls-overlay');
    const meta = document.getElementById('metadataPanel');
    const wasCollapsed = meta && meta.classList.contains('collapsed');
    if (meta) meta.classList.remove('collapsed');
    const r = {
      area: box(area),
      overlay: ov ? box(ov) : 'none',
      meta: meta ? box(meta) : 'none',
      controlsH: getComputedStyle(document.documentElement).getPropertyValue('--controls-h').trim(),
    };
    if (meta && wasCollapsed) meta.classList.add('collapsed');
    return r;
  };

  const out = { vp: innerWidth + 'x' + innerHeight, chrome: null, layouts: {} };
  const startLayout = player.layoutMode;
  for (const name of ['grid4', 'grid', 'legacy', 'single']) {
    setLayout(name);
    out.layouts[name] = tiles();
    out.chrome = chrome();
  }
  setLayout(startLayout);
  out.startLayout = startLayout;

  // ⋮ menu: does it now paint above the 行车数据 HUD?
  const headerRight = document.querySelector('.header-right');
  const header = document.querySelector('.main-header');
  headerRight.classList.add('active');
  const menu = document.querySelector('.header-actions-group');
  const rows = Array.from(menu.querySelectorAll('button, a'));
  const lastRow = rows[rows.length - 1];
  const last = lastRow.getBoundingClientRect();
  const mid = document.elementFromPoint(Math.round(last.left + last.width / 2), Math.round(last.top + last.height / 2));
  out.menu = {
    headerZ: getComputedStyle(header).zIndex,
    menuBox: box(menu),
    menuScroll: menu.scrollHeight + '/' + menu.clientHeight,
    rowCount: rows.length,
    lastRow: lastRow.textContent.trim().slice(0, 12) + ' ' + Math.round(last.width) + 'x' + Math.round(last.height) + '@' + Math.round(last.top),
    hitOnLastRow: mid ? (mid.tagName + '.' + (mid.getAttribute('class') || '')).slice(0, 44) : 'null',
    insideMenu: !!menu.contains(mid),
  };
  headerRight.classList.remove('active');

  // 详细数据 stats plate: position below the header, and readable in the current theme.
  const stats = document.getElementById('statsOverlay') || document.querySelector('.stats-overlay');
  const wasShown = stats && stats.classList.contains('show');
  if (stats) {
    stats.classList.add('show');
    const label = stats.querySelector('.stats-label');
    const value = stats.querySelector('.stats-value');
    out.stats = {
      box: box(stats),
      headerBottom: Math.round(header.getBoundingClientRect().bottom),
      overlapsHeader: stats.getBoundingClientRect().top < header.getBoundingClientRect().bottom,
      scroll: stats.scrollHeight + '/' + stats.clientHeight,
      bg: getComputedStyle(stats).backgroundColor,
      label: label ? getComputedStyle(label).color : 'none',
      value: value ? getComputedStyle(value).color : 'none',
      dark: document.body.classList.contains('dark-theme'),
    };
    if (!wasShown) stats.classList.remove('show');
  }
  return JSON.stringify(out, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r15-live.js`;
writeFileSync(tmp, expr, 'utf8');
console.log(execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', tmp], { encoding: 'utf8' }));

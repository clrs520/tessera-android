// Round 16: is the clip list now the home screen, and is the landscape HUD a card?
// The *current* styles.css is injected into the running 1.1.5 page, so the numbers come from the
// real rules; the home-mode class and the sidebar state are set by hand because the installed
// build has no updatePhoneHomeMode() yet.
//
//   node devtools/probe-r16.mjs            # portrait
//   node devtools/probe-r16.mjs landscape  # landscape
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const css = readFileSync(`${root}/TDashcamStudio/src/styles.css`, 'utf8');
const landscape = process.argv.includes('landscape');

const expr = `(async () => {
  document.getElementById('r16-live')?.remove();
  const style = document.createElement('style');
  style.id = 'r16-live';
  style.textContent = ${JSON.stringify(css)};
  document.head.appendChild(style);
  await new Promise(r => requestAnimationFrame(r));

  const box = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.left) + ',' + Math.round(r.top);
  };
  const cs = (el, ...props) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    return props.map(p => p + '=' + s[p]).join(' ');
  };

  const html = document.documentElement;
  const sidebar = document.querySelector('.sidebar');
  const bar = document.getElementById('phoneActionBar');
  const panel = document.getElementById('metadataPanel');
  const out = { vp: innerWidth + 'x' + innerHeight, actionH: html.style.getPropertyValue('--action-h') };

  document.body.classList.add('phone-list-home');
  viewer.toggleSidebar(true);
  await new Promise(r => setTimeout(r, 400));
  out.home = {
    sidebar: box(sidebar),
    sidebarCss: cs(sidebar, 'transform', 'bottom', 'borderRightWidth'),
    bar: box(bar),
    barCss: cs(bar, 'opacity', 'display', 'pointerEvents'),
    scrim: cs(document.getElementById('overlay'), 'display'),
    closeBtn: cs(document.getElementById('toggleSidebarBtn'), 'display'),
    list: box(document.getElementById('fileList')),
    footer: box(document.querySelector('.sidebar-footer')),
    cards: document.querySelectorAll('.video-card').length,
    firstCard: box(document.querySelector('.video-card')),
    thumb: box(document.querySelector('.video-card .video-thumbnail')),
    stillEmpty: document.getElementById('playerArea').classList.contains('empty'),
    inert: String(sidebar.inert),
  };

  if (${JSON.stringify(landscape)}) {
    // The landscape multi-feed still hides the strip (1.1.5), so the card only applies to the
    // single-camera view — measure it there.
    out.layoutBefore = document.querySelector('.player-area').className;
    viewer.multiCameraPlayer.setLayout('single');
    panel.classList.remove('collapsed');
    // No SEI metadata in this session, so the manager keeps #metadataItems hidden and shows the
    // "no data" line instead — force the real dashboard back in to measure the card as it looks
    // during playback.
    document.getElementById('metadataEmpty').style.display = 'none';
    document.getElementById('metadataLoading').style.display = 'none';
    document.getElementById('metadataItems').style.display = 'flex';
    const gear = panel.querySelector('.meta-gear');
    if (gear) gear.textContent = 'D';
    const speed = document.getElementById('metaSpeed');
    if (speed) speed.textContent = '63';
    const secondary = panel.querySelector('.metadata-secondary');
    await new Promise(r => setTimeout(r, 500));
    out.hud = {
      layout: document.querySelector('.player-area').className,
      panel: box(panel),
      panelCss: cs(panel, 'position', 'top', 'bottom', 'left', 'right', 'maxWidth'),
      secondary: secondary ? cs(secondary, 'display') + ' ' + box(secondary) : 'absent',
      dashboard: box(panel.querySelector('.metadata-dashboard')),
      parts: Array.from(panel.querySelectorAll('.metadata-content > *, .metadata-items > *, .metadata-dashboard > *, .metadata-secondary > *'))
          .map(e => (typeof e.className === 'string' ? e.className : e.tagName) + ':' + box(e)),
      zoomBtn: box(document.querySelector('.camera-zoom-out-btn')),
      controlsH: html.style.getPropertyValue('--controls-h'),
      metaBottomVar: html.style.getPropertyValue('--meta-bottom'),
      playerPadding: cs(document.querySelector('.player-area'), 'paddingBottom'),
      feed: box(document.querySelector('.video-container:not(.hidden)')),
    };
  }

  document.body.classList.remove('phone-list-home');
  return JSON.stringify(out, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r16${landscape ? '-land' : ''}.js`;
writeFileSync(tmp, expr, 'utf8');
console.log(execFileSync(process.env.NODE || 'node', [`${root}/devtools/cdp-eval.mjs`, '--file', tmp],
    { encoding: 'utf8', timeout: 60000 }));

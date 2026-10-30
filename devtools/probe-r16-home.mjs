// Measure round-16 on the installed build: is the event list the home screen, and is
// anything from the old drawer/fullscreen behaviour left behind? Run via
//   node devtools/cdp-eval.mjs --file devtools/probe-r16-home.mjs
(async () => {
  const out = {};
  const box = el => {
    if (!el) return 'absent';
    const r = el.getBoundingClientRect();
    return `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`;
  };
  const cs = (el, ...props) => {
    if (!el) return 'absent';
    const s = getComputedStyle(el);
    return props.map(p => `${p}=${s[p]}`).join(' ');
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));

  out.viewport = `${innerWidth}x${innerHeight}`;
  out.body = document.body.className;
  const sidebar = document.querySelector('.sidebar');
  const list = document.getElementById('fileList');
  const bar = document.getElementById('phoneActionBar');
  const overlay = document.getElementById('overlay');
  const toggleBtn = document.querySelector('.sidebar-header .toggle-sidebar-btn');
  const closeBtn = document.getElementById('closeSidebarBtn');

  out.sidebar = box(sidebar) + ' | ' + cs(sidebar, 'position', 'width', 'maxWidth', 'transform', 'zIndex');
  out.sidebarInert = sidebar ? String(sidebar.inert) + ' hidden=' + sidebar.getAttribute('aria-hidden') : 'absent';
  out.list = box(list);
  out.listItems = list ? list.children.length : -1;
  out.thumb = box(document.querySelector('.video-card .video-thumbnail'));
  out.footer = box(document.querySelector('.sidebar-footer'));
  out.bar = box(bar) + ' | ' + cs(bar, 'opacity', 'display', 'pointerEvents');
  out.overlay = cs(overlay, 'display');
  out.toggleBtn = cs(toggleBtn, 'display');
  if (closeBtn) out.closeBtn = cs(closeBtn, 'display');
  out.actionH = getComputedStyle(document.documentElement).getPropertyValue('--action-h');
  out.controlsH = getComputedStyle(document.documentElement).getPropertyValue('--controls-h');
  out.safeTop = getComputedStyle(document.documentElement).getPropertyValue('--safe-top');
  out.playerArea = box(document.getElementById('playerArea')) + ' empty=' +
      document.getElementById('playerArea').classList.contains('empty');
  const appv = (typeof viewer !== "undefined") ? viewer : null;
  out.layers = appv && appv.phoneLayerCount ? appv.phoneLayerCount() : 'no-viewer';
  out.homeFlag = appv && appv.isPhoneListHome ? appv.isPhoneListHome() : 'no-viewer';
  // The drawer must stay reachable for the tap-away path even while docked.
  out.sidebarCollapsedClass = document.body.classList.contains('sidebar-collapsed');

  // Can the thumb-zone actions still be reached from the home screen?
  const hits = {};
  for (const [name, sel] of [['refresh', '#refreshBtn'], ['selectFolder', '#selectFolderBtn'],
                             ['search', '#searchInput'], ['quickFilters', '#quickFilters']]) {
    const el = document.querySelector(sel);
    if (!el) { hits[name] = 'absent'; continue; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) { hits[name] = 'zero-size'; continue; }
    const p = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    hits[name] = (el.contains(p) || p === el ? 'ok' : 'covered by ' + (p ? p.className || p.tagName : 'null')) +
        ' ' + box(el);
  }
  out.hits = hits;
  return JSON.stringify(out, null, 1);
})()

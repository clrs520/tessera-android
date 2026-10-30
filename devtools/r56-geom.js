(() => {
  const sb = document.querySelector('.sidebar');
  if (!sb) return JSON.stringify({ err: 'no sidebar' });
  const q = s => sb.querySelector(s) || document.querySelector(s);
  const box = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return {
      y: Math.round(r.top), h: Math.round(r.height), x: Math.round(r.left), w: Math.round(r.width),
      right: Math.round(r.right), disp: c.display, vis: c.visibility, color: c.color,
      font: c.fontSize, bg: c.backgroundColor, padTop: c.paddingTop, padBottom: c.paddingBottom,
      bbw: c.borderBottomWidth, bbi: c.backgroundImage.slice(0, 24)
    };
  };
  const row = q('.event-search-row');
  const field = q('#eventSearch');
  const hdr = q('.sidebar-header');
  const done = q('#drawerDoneBtn');
  const burger = q('#toggleSidebarBtn');
  const funnel = q('#filterToggleBtn');
  const kids = [...sb.children].map(el => ({
    cls: (el.className || el.id || el.tagName).toString().split(' ')[0],
    disp: getComputedStyle(el).display,
    y: Math.round(el.getBoundingClientRect().top),
    h: Math.round(el.getBoundingClientRect().height)
  }));
  return JSON.stringify({
    viewer: typeof window.viewer,
    htmlCls: document.documentElement.className,
    sidebarCls: sb.className,
    w: innerWidth, hh: innerHeight,
    safeTop: getComputedStyle(document.documentElement).getPropertyValue('--safe-top').trim(),
    fieldH: getComputedStyle(field).height,
    header: box(hdr), row: box(row), done: box(done), burger: box(burger),
    funnel: box(funnel),
    doneLabel: done && done.textContent,
    hdrBgColor: getComputedStyle(hdr).backgroundColor,
    hdrBgImg: getComputedStyle(hdr).backgroundImage,
    hdrBb: getComputedStyle(hdr).borderBottomWidth,
    sbBg: getComputedStyle(sb).backgroundColor,
    list: box(q('#fileList')),
    chips: box(q('.date-chips')),
    active: document.activeElement && document.activeElement.id,
    cards: document.querySelectorAll('[data-event-id]').length,
    sidebarScroll: { sw: sb.scrollWidth, cw: sb.clientWidth, sr: Math.round(sb.getBoundingClientRect().right) },
    overlayActive: !!(q('#overlay') && q('#overlay').classList.contains('active')),
    kids
  });
})()

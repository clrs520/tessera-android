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
  const hdr = q('.sidebar-header');
  const row = q('.event-search-row');
  const field = q('#eventSearch');
  const done = q('#drawerDoneBtn');
  const cancel = q('#searchCancelBtn');
  // Which label is actually in the single trailing slot right now.
  const slot = [done, cancel].filter(el => el && getComputedStyle(el).display !== 'none')
    .map(el => el.id + ':' + el.textContent.trim());
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
    header: box(hdr), row: box(row), field: box(field), slot,
    done: box(done), cancel: box(cancel),
    burger: box(q('#toggleSidebarBtn')), funnel: box(q('#filterToggleBtn')),
    cancelParent: cancel && cancel.parentElement.className,
    rowKids: [...row.children].map(el => el.id || el.className),
    hdrBgImg: getComputedStyle(hdr).backgroundImage,
    hdrBb: getComputedStyle(hdr).borderBottomWidth,
    sbBg: getComputedStyle(sb).backgroundColor,
    list: box(q('#fileList')), chips: box(q('.date-chips')),
    active: document.activeElement && document.activeElement.id,
    cards: document.querySelectorAll('[data-event-id]').length,
    kb: getComputedStyle(document.documentElement).getPropertyValue('--kb-h').trim(),
    sidebarScroll: { sw: sb.scrollWidth, cw: sb.clientWidth, sr: Math.round(sb.getBoundingClientRect().right) },
    overlayActive: !!(q('#overlay') && q('#overlay').classList.contains('active')),
    kids
  });
})()

(() => {
  const sb = document.querySelector('.sidebar');
  if (!sb) return JSON.stringify({ err: 'no sidebar' });
  const q = s => sb.querySelector(s) || document.querySelector(s);
  const box = el => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = getComputedStyle(el);
    return { y: Math.round(r.top), h: Math.round(r.height), x: Math.round(r.left), w: Math.round(r.width), disp: c.display, vis: c.visibility, transform: c.transform };
  };
  const row = q('.event-search-row');
  const field = q('#eventSearch');
  const cancel = q('#searchCancelBtn');
  const hdr = q('.sidebar-header');
  const title = q('.sidebar-header .header-title');
  const chips = q('.date-chips');
  const list = q('#fileList');
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
    w: innerWidth, hh: innerHeight, orient: getComputedStyle(document.documentElement).getPropertyValue('--viewport-h').trim(),
    kbNative: getComputedStyle(document.documentElement).getPropertyValue('--kb-native-h').trim(),
    kbH: getComputedStyle(document.documentElement).getPropertyValue('--kb-h').trim(),
    safeTop: getComputedStyle(document.documentElement).getPropertyValue('--safe-top').trim(),
    fieldH: getComputedStyle(field).height,
    row: box(row), header: box(hdr), titleVis: getComputedStyle(title).visibility,
    chips: box(chips), list: box(list),
    cancel: box(cancel),
    active: document.activeElement && document.activeElement.id,
    query: field.value,
    cards: document.querySelectorAll('[data-event-id]').length,
    sidebarScroll: { sw: sb.scrollWidth, cw: sb.clientWidth },
    rowBg: getComputedStyle(row).backgroundColor,
    hdrBg: getComputedStyle(hdr).backgroundColor,
    kids
  });
})()

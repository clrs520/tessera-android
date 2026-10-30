(() => {
  const bar = document.querySelector('.phone-action-bar');
  if (!bar) return JSON.stringify({ err: 'no action bar' });
  const c = el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      id: el.id, act: el.dataset.action, txt: el.textContent.trim(),
      aria: el.getAttribute('aria-label'), cur: el.getAttribute('aria-current'),
      on: el.classList.contains('on'),
      x: Math.round(r.left), w: Math.round(r.width), y: Math.round(r.top), h: Math.round(r.height),
      opa: cs.opacity, vis: cs.visibility, back: cs.backgroundColor, col: cs.color,
      capDisp: getComputedStyle(el.querySelector('.tab-label')).display,
      icH: Math.round(el.querySelector('.tab-icon').getBoundingClientRect().height)
    };
  };
  const br = bar.getBoundingClientRect();
  const bs = getComputedStyle(bar);
  const segs = [...document.querySelectorAll('#viewSwitcher .view-btn')];
  const active = segs.filter(el => el.classList.contains('active') || el.classList.contains('on'));
  return JSON.stringify({
    viewer: typeof window.viewer,
    htmlCls: document.documentElement.className,
    bodyCls: document.body.className,
    w: innerWidth, hh: innerHeight,
    playGone: !document.getElementById('tabPlayBtn'),
    count: bar.querySelectorAll('.tab-btn').length,
    tabs: [...bar.querySelectorAll('.tab-btn')].map(c),
    bar: {
      x: Math.round(br.left), y: Math.round(br.top), w: Math.round(br.width),
      h: Math.round(br.height), right: Math.round(br.right),
      disp: bs.display, vis: bs.visibility, opa: bs.opacity, radius: bs.borderRadius
    },
    layout: localStorage.getItem('tdashcam.layout'),
    viewBtnCount: segs.length,
    viewActive: active.map(el => el.dataset.view),
    noHScroll: document.documentElement.scrollWidth <= innerWidth + 1,
    cards: document.querySelectorAll('[data-event-id]').length,
    playing: !!(window.viewer && window.viewer.currentEvent)
  });
})()

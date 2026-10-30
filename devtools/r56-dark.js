(() => {
  window.viewer?.setThemeChoice('dark');
  const sb = document.querySelector('.sidebar');
  const done = sb.querySelector('#drawerDoneBtn');
  const title = sb.querySelector('.sidebar-header .header-title');
  const lum = c => {
    const m = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(n => {
      const v = n / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2];
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return ((x + 0.05) / (y + 0.05)).toFixed(2);
  };
  const dc = getComputedStyle(done).color;
  const bg = getComputedStyle(sb).backgroundColor;
  return JSON.stringify({
    bodyCls: document.body.className,
    doneColor: dc,
    sbBg: bg,
    doneOnDrawer: ratio(dc, bg),
    titleColor: getComputedStyle(title).color,
    hdrBgImg: getComputedStyle(sb.querySelector('.sidebar-header')).backgroundImage,
    burger: getComputedStyle(sb.querySelector('#toggleSidebarBtn')).display,
    doneDisp: getComputedStyle(done).display,
    doneBox: (() => { const r = done.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(' '); })(),
    kids: [...sb.children].map(el => (el.className || el.id).toString().split(' ')[0] + '@' + Math.round(el.getBoundingClientRect().top) + 'x' + Math.round(el.getBoundingClientRect().height)).join(' ')
  });
})()

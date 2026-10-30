(() => {
  const sw = document.getElementById('viewSwitcher');
  const cs = sw ? getComputedStyle(sw) : null;
  const rows = [];
  document.querySelectorAll('.controls-section, .controls-section-wrapper, .controls-left, .controls-right').forEach((sec) => {
    const r = sec.getBoundingClientRect();
    rows.push({
      sec: sec.className,
      rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
      kids: [...sec.children].map((k) => {
        const b = k.getBoundingClientRect();
        return (k.id || String(k.className).split(' ')[0]) + '[' + [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)].join(',') + ']';
      }),
    });
  });
  return JSON.stringify({
    switcher: cs ? {
      overflowX: cs.overflowX, scrollW: sw.scrollWidth, clientW: sw.clientWidth,
      rect: [Math.round(sw.getBoundingClientRect().x), Math.round(sw.getBoundingClientRect().y), Math.round(sw.getBoundingClientRect().width), Math.round(sw.getBoundingClientRect().height)],
    } : null,
    rows,
  }, null, 1);
})()

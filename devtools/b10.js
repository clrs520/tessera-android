(() => {
  if (document.documentElement.classList.contains('dark-theme')) viewer.toggleTheme();
  const lbl = document.getElementById('brightnessRowLabel');
  const row = document.getElementById('brightnessRow');
  const panel = document.getElementById('morePanel');
  const r = lbl.getBoundingClientRect();
  return JSON.stringify({
    theme: document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light',
    panelOpen: panel ? !panel.classList.contains('hidden') : null,
    rowVisible: row ? getComputedStyle(row).display : 'missing',
    text: lbl.textContent,
    w: Math.round(r.width),
    h: Math.round(r.height),
    ellipsised: lbl.scrollWidth > lbl.clientWidth + 1,
    scrollWidth: lbl.scrollWidth,
    clientWidth: lbl.clientWidth,
    color: getComputedStyle(lbl).color,
    level: viewer.brightnessLevel,
  }, null, 2);
})()

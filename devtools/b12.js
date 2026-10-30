(() => {
  if (document.body.classList.contains('dark-theme')) viewer.toggleTheme();
  const lbl = document.getElementById('brightnessRowLabel');
  return JSON.stringify({
    bodyClass: document.body.className,
    text: lbl.textContent,
    color: getComputedStyle(lbl).color,
    ellipsised: lbl.scrollWidth > lbl.clientWidth + 1,
    scrollWidth: lbl.scrollWidth, clientWidth: lbl.clientWidth,
    level: viewer.brightnessLevel,
  }, null, 2);
})()

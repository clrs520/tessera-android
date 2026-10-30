(() => {
  const dim = document.getElementById('phoneBrightnessDim');
  const hud = document.getElementById('phoneBrightnessHud');
  const fill = document.getElementById('phoneBrightnessFill');
  const val = document.getElementById('phoneBrightnessValue');
  const cs = (e) => e ? getComputedStyle(e) : null;
  return JSON.stringify({
    stored: localStorage.getItem('tdashcam.brightness'),
    dimOpacity: dim && cs(dim).opacity, dimDisplay: dim && cs(dim).display,
    hudDisplay: hud && cs(hud).display, hudClass: hud && hud.className,
    hudRect: hud && cs(hud).display !== 'none' ? JSON.parse(JSON.stringify(hud.getBoundingClientRect().toJSON())) : null,
    fillWidth: fill && fill.style.width, value: val && val.textContent,
    eventSwitched: (document.querySelector('.event-item.selected, .event-item.active')?.textContent || '').trim().slice(0, 30),
    playing: document.querySelector('video')?.paused === false,
  });
})()

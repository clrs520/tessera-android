(() => {
  const on = (s) => [...document.querySelectorAll(s)].filter(c => c.classList.contains('on'))
    .map(c => (c.textContent || '').trim());
  const r = (e) => { if (!e) return 'missing'; const b = e.getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}@${Math.round(b.x)},${Math.round(b.y)}`; };
  return JSON.stringify({
    sheet: getComputedStyle(document.querySelector('.phone-export-sheet')).display,
    cameras: on('#peCameraChips [data-camera]'),
    sizes: on('#peSizeChips [data-size]'),
    summary: document.querySelector('#peSummary')?.textContent || null,
    range: [document.querySelector('#peStartInput')?.value, document.querySelector('#peEndInput')?.value],
    startDisabled: document.querySelector('#peStartBtn')?.disabled,
    panel: r(document.querySelector('.phone-export-panel')),
    vw: innerWidth, vh: innerHeight,
  }, null, 1);
})()

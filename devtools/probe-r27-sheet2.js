(() => {
  const r = (id) => { const e = document.getElementById(id); if (!e) return id + ':missing'; const b = e.getBoundingClientRect(); return `${id}=[${Math.round(b.x+b.width/2)},${Math.round(b.y+b.height/2)}] ${e.value || e.textContent.trim().slice(0,30)}${e.disabled ? ' DISABLED' : ''}`; };
  return [r('peStartBtn'), r('peEndInput'), r('peStartInput'), 'chips=' + document.querySelectorAll('#peCameraChips .pe-chip').length,
    'on=' + [...document.querySelectorAll('#peCameraChips .pe-chip.on')].map(c=>c.dataset.camera||c.textContent.trim()).join(','),
    'size=' + [...document.querySelectorAll('#peSizeChips .pe-chip.on')].map(c=>c.textContent.trim()).join(',')].join(' | ');
})()

(() => {
  const r = (id) => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(); return {x:Math.round(b.x+b.width/2), y:Math.round(b.y+b.height/2), w:Math.round(b.width), h:Math.round(b.height), dis:e.disabled}; };
  const m = document.getElementById('phoneExportModal');
  return JSON.stringify({
    sheetOpen: m ? getComputedStyle(m).display : 'none',
    start: r('peStartBtn'),
    summary: document.getElementById('peSummary')?.textContent?.trim() || null,
    size: document.getElementById('peSizeLabel')?.textContent?.trim() || null,
    body: [...document.querySelectorAll('#phoneExportModal .pe-chip.on')].map(e=>e.textContent.trim()),
  });
})()

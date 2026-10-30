(() => {
  const out = {};
  const m = document.getElementById('phoneExportModal');
  out.open = m ? getComputedStyle(m).display : 'none';
  out.summary = document.getElementById('peSummary')?.textContent?.trim();
  out.chips = [...document.querySelectorAll('#peCameraChips .pe-chip')].map(c => ({ t: c.textContent.trim(), on: c.classList.contains('on'), r: (() => { const b = c.getBoundingClientRect(); return [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)]; })() }));
  out.sizes = [...document.querySelectorAll('#peSizeChips .pe-chip')].map(c => ({ t: c.textContent.trim(), on: c.classList.contains('on'), r: (() => { const b = c.getBoundingClientRect(); return [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2)]; })() }));
  const start = document.getElementById('peStartBtn');
  if (start) { const b = start.getBoundingClientRect(); out.start = [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2), start.disabled]; }
  const end = document.getElementById('peEndInput');
  if (end) { const b = end.getBoundingClientRect(); out.end = [Math.round(b.x+b.width/2), Math.round(b.y+b.height/2), end.value]; }
  return JSON.stringify(out, null, 1);
})()

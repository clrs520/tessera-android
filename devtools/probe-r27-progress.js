(() => {
  const m = document.getElementById('phoneExportModal');
  const txt = (id) => document.getElementById(id)?.textContent?.trim() || null;
  return JSON.stringify({
    sheetOpen: m ? getComputedStyle(m).display : 'none',
    progress: txt('peProgressText'),
    pct: txt('peProgressPct'),
    out: txt('peOutputPath'),
  });
})()

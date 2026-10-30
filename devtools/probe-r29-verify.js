(() => {
  const g = document.getElementById('headerActionsGroup');
  const rows = [...g.querySelectorAll('button')].filter(b => getComputedStyle(b).display !== 'none');
  const b = document.getElementById('revealFileBtn');
  const d = document.getElementById('downloadFileBtn');
  const r = b.getBoundingClientRect();
  const rd = d.getBoundingClientRect();
  const foot = document.querySelector('.sidebar-footer, .app-version, #appVersion');
  return JSON.stringify({
    footer: foot ? (foot.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : 'none',
    alertShimmed: /showToast/.test(window.alert.toString()),
    playing: viewer.multiCameraPlayer.isPlaying,
    disabledIds: rows.filter(x => x.disabled).map(x => x.id || x.className),
    reveal: { dis: b.disabled, op: getComputedStyle(b).opacity, cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2) },
    download: { dis: d.disabled, op: getComputedStyle(d).opacity, cx: Math.round(rd.x + rd.width / 2), cy: Math.round(rd.y + rd.height / 2) },
    jsErrors: (window.__tdashcamErrors || []).length
  }, null, 1);
})()

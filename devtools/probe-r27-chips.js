(() => {
  const m = document.getElementById('phoneExportModal');
  const ids = [...m.querySelectorAll('[id]')].map(e => `${e.id}:${getComputedStyle(e).display}`);
  const btns = [...m.querySelectorAll('button')].map(b => { const r = b.getBoundingClientRect(); return `${b.id||b.className}|${b.textContent.trim().slice(0,8)}|${Math.round(r.x+r.width/2)},${Math.round(r.y+r.height/2)}|on=${b.classList.contains('on')||b.getAttribute('aria-pressed')}`; });
  return JSON.stringify({ ids, btns }, null, 1);
})()

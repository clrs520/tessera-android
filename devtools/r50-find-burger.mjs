(() => {
  const out = [];
  document.querySelectorAll('button, [role=button], .icon-btn, [id*=oggle], [class*=oggle]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    if (r.top > 200) return;
    out.push([el.id, el.className, Math.round(r.left+r.width/2), Math.round(r.top+r.height/2)]);
  });
  return JSON.stringify(out);
})()

(() => {
  const p = document.getElementById('metadataPanel') || document.querySelector('.metadata-panel');
  const kids = [...p.querySelectorAll('*')].slice(0, 40).map(e => {
    const r = e.getBoundingClientRect();
    return { tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className || '').toString().slice(0, 40),
      txt: (e.childElementCount === 0 ? (e.textContent || '').trim().slice(0, 18) : ''),
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      pe: getComputedStyle(e).pointerEvents };
  });
  return JSON.stringify({ cls: p.className, attrs: [...p.attributes].map(a => a.name + '=' + a.value).join(' '), kids }, null, 1);
})()

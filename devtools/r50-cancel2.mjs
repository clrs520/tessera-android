(() => {
  const row = window.viewer.dom.eventSearchRow;
  return JSON.stringify([...row.querySelectorAll('button, [role=button], span, div')].map(el => {
    const r = el.getBoundingClientRect();
    return [el.tagName + '#' + el.id + '.' + el.className, Math.round(r.left+r.width/2), Math.round(r.top+r.height/2), el.textContent.trim().slice(0,8)];
  }));
})()

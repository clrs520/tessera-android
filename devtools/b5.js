// R67: map the left-third band so we know which chrome steals the vertical drag.
(() => {
  const rows = [];
  for (let y = 85; y <= 315; y += 10) {
    const el = document.elementFromPoint(116, y);
    if (!el) continue;
    rows.push({ y, cls: (el.id ? '#' + el.id : '') + '.' + (typeof el.className === 'string' ? el.className.trim().replace(/\s+/g, '.') : ''), ta: getComputedStyle(el).touchAction, parent: el.parentElement && el.parentElement.className });
  }
  return rows;
})();

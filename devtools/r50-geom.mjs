(() => {
  const v = window.viewer, sb = v.dom.sidebar, row = v.dom.eventSearchRow;
  const inp = v.dom.eventSearch, title = sb.querySelector('.header-title'), hdr = sb.querySelector('.sidebar-header');
  const g = el => { const r = el.getBoundingClientRect(); return {top: +r.top.toFixed(1), h: +r.height.toFixed(1), mid: +(r.top+r.height/2).toFixed(1)}; };
  sb.style.removeProperty('--nav-shift');
  void row.offsetHeight;
  const pre = { row: g(row), title: g(title) };
  sb.style.setProperty('--nav-shift', '-41.5px');
  return JSON.stringify({ pre, rowCS: {h: getComputedStyle(row).height, mb: getComputedStyle(row).marginBottom}, inpCS: getComputedStyle(inp).height, hdr: g(hdr), safeTop: getComputedStyle(sb).getPropertyValue('--safe-top'), fieldH: getComputedStyle(sb).getPropertyValue('--field-h') });
})()

(() => {
  const v = window.viewer, sb = v.dom.sidebar;
  v.dom.eventSearch.blur();
  void v.dom.eventSearch.offsetHeight;
  sb.classList.remove('nav-search');
  sb.style.removeProperty('--nav-shift');
  v.dom.eventSearch.focus();
  return 're-entered';
})()

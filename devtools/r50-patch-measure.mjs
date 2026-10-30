(() => {
  const P = Object.getPrototypeOf(window.viewer);
  P.setNavShift = function () {
    const sidebar = this.dom.sidebar, row = this.dom.eventSearchRow;
    if (!sidebar || !row) return null;
    sidebar.style.removeProperty('--nav-shift');
    const dy = this.measureNavShift();
    if (dy !== null) sidebar.style.setProperty('--nav-shift', dy.toFixed(1) + 'px');
    return dy;
  };
  P.setSearchMode = function (on) {
    const sidebar = this.dom.sidebar, row = this.dom.eventSearchRow;
    if (!sidebar || !row) return;
    if (!on) {
      if (document.activeElement === this.dom.eventSearch) return;
      sidebar.classList.remove('nav-search');
      return;
    }
    if (sidebar.classList.contains('nav-search')) return;
    sidebar.classList.add('nav-search');
    if (this.setNavShift() === null) sidebar.classList.remove('nav-search');
  };
  // leave and re-enter so the new path runs
  sidebar_leave: {
    const sb = window.viewer.dom.sidebar;
    sb.classList.remove('nav-search');
    sb.style.removeProperty('--nav-shift');
    window.viewer.dom.eventSearch.focus();
  }
  return 'patched';
})()

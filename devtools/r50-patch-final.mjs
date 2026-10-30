(() => {
  const P = Object.getPrototypeOf(window.viewer);
  P.setNavShift = function (animate) {
    if (animate === undefined) animate = true;
    const sidebar = this.dom.sidebar, row = this.dom.eventSearchRow;
    if (!sidebar || !row) return null;
    row.style.transition = 'none';
    sidebar.style.removeProperty('--nav-shift');
    void row.offsetHeight;
    if (animate) row.style.transition = '';
    const dy = this.measureNavShift();
    if (dy !== null) sidebar.style.setProperty('--nav-shift', dy.toFixed(1) + 'px');
    if (!animate) { void row.offsetHeight; row.style.transition = ''; }
    return dy;
  };
  P.setSearchMode = function (on) {
    if (!isPhoneSurfaceLayout()) return;
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
  P.refreshNavShift = function () {
    const sidebar = this.dom.sidebar;
    if (!sidebar?.classList.contains('nav-search')) return;
    const measure = () => this.setNavShift(false);
    measure();
    clearTimeout(this._navShiftTimer);
    this._navShiftTimer = setTimeout(measure, 300);
  };
  // leave search mode cleanly
  window.viewer.dom.eventSearch.blur();
  void window.viewer.dom.eventSearch.offsetHeight;
  window.viewer.dom.sidebar.classList.remove('nav-search');
  window.viewer.dom.sidebar.style.removeProperty('--nav-shift');
  return 'final-patched';
})()

// R173 · put the drawer where the tap criteria assume it: open. A cold start leaves it shut, and the
// sheet's own open/closed state is persisted, so neither can be taken for granted.
JSON.stringify((() => {
    const v = window.viewer, sb = v.dom.sidebar;
    if (sb.classList.contains('collapsed') && typeof v.toggleSidebar === 'function') v.toggleSidebar(true);
    return { collapsed: sb.classList.contains('collapsed'), cls: sb.className };
})());

// R181 · put the real folder back after the screenshot pass.
JSON.stringify((() => {
    const v = window.viewer;
    if (!window.__r181real) return { nothingToRestore: true };
    v.eventGroups = window.__r181real;
    v.filterAndRender();
    window.__r181real = null;
    return { restored: v.eventGroups.length,
        rows: v.dom.fileList.querySelectorAll('.video-card').length };
})());

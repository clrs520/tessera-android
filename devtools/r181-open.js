JSON.stringify((() => {
    const v = window.viewer, list = v.dom.fileList;
    if (!list.classList.contains('open') && typeof v.openDrawer === 'function') v.openDrawer();
    const r = list.getBoundingClientRect();
    return { cls: list.className, left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height),
        scrollH: Math.round(list.scrollHeight), clientH: Math.round(list.clientHeight) };
})());

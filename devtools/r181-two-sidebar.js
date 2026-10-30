JSON.stringify((() => {
    const v = window.viewer;
    const byId = document.getElementById('sidebar');
    return { sameNode: byId === v.dom.sidebar,
        byIdClass: byId ? byId.className : null, domClass: v.dom.sidebar ? v.dom.sidebar.className : null,
        byIdTag: byId ? byId.tagName : null, domTag: v.dom.sidebar ? v.dom.sidebar.tagName : null,
        domId: v.dom.sidebar ? v.dom.sidebar.id : null,
        matches: [...document.querySelectorAll('.sidebar')].map((n) => `${n.tagName}#${n.id}.${n.className}`) };
})());

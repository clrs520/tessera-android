(() => {
    const names = [];
    let o = viewer;
    while (o) { Object.getOwnPropertyNames(o).forEach(n => { if (/meta/i.test(n)) names.push(n); }); o = Object.getPrototypeOf(o); }
    const panel = document.getElementById('metadataPanel');
    const r = panel ? panel.getBoundingClientRect() : null;
    const ov = document.querySelector('.video-controls-overlay').getBoundingClientRect();
    return JSON.stringify({
        names: [...new Set(names)],
        panel: r && { y: Math.round(r.y), h: Math.round(r.height), cls: panel.className },
        overlayTop: Math.round(ov.y),
        root: document.getElementById('metadataPanel') ? 'id' : 'noid',
    });
})()

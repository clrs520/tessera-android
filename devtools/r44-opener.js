(() => {
    const b = document.querySelector('#tabMoreBtn');
    if (!b) return JSON.stringify({err: 'no #tabMoreBtn'});
    const r = b.getBoundingClientRect();
    return JSON.stringify({
        orient: screen.orientation.type, view: innerWidth + 'x' + innerHeight,
        dpr: devicePixelRatio,
        more: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        centerDevice: [Math.round((r.x + r.width / 2) * devicePixelRatio), Math.round((r.y + r.height / 2) * devicePixelRatio)],
        sheetOpen: !!document.querySelector('.header-collapsed .header-actions-group')
    });
})()

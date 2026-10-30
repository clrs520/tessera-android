(async () => {
    const c = window.viewer.videoListComponent;
    const el = c.container;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    let scrolled = 0;
    el.addEventListener('scroll', () => { scrolled += 1; }, { passive: true });
    const out = [{ st: el.scrollTop, top: c.listTop, end: c.listEnd, rows: c.listRowNodes().length }];
    el.scrollTop = 10000;
    for (let i = 0; i < 3; i++) { await frame(); out.push({ st: el.scrollTop, top: c.listTop, end: c.listEnd, rows: c.listRowNodes().length, scrolled }); }
    return JSON.stringify(out);
})()

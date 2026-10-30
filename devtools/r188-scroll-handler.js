// R188 #2 follow-up — is the scroll handler running at all after a windowed re-render?
(async () => {
    const c = window.viewer.videoListComponent;
    const el = c.container;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    const snap = (tag) => ({
        tag, st: el.scrollTop, top: c.listTop, end: c.listEnd,
        rows: c.listRowNodes().length, armed: c.listScrollArmed,
    });
    const out = [snap('now')];
    el.scrollTop = 37000;
    out.push(snap('set'));
    for (let i = 0; i < 4; i++) { await frame(); out.push(snap('f' + i)); }
    c.syncListWindow();
    out.push(snap('manual-sync'));
    await frame();
    out.push(snap('after-manual'));
    return JSON.stringify(out);
})()

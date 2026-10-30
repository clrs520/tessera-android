// R181 · why does the first paint of a windowed list hold more rows when the drawer is open?
// Samples the same quantity every 100 ms for ~2.5 s and records scrollTop alongside it.
JSON.stringify((() => {
    const v = window.viewer, list = v.dom.fileList, l = v.videoListComponent;
    if (!window.__r181real) window.__r181real = v.eventGroups;
    const real = window.__r181real;
    const TOTAL = 3000;
    const base = Date.parse('2026-09-01T08:00:00Z');
    const p = (x) => String(x).padStart(2, '0');
    const arr = new Array(TOTAL);
    for (let i = 0; i < TOTAL; i += 1) {
        const t = new Date(base - i * 60000);
        const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-00`;
        arr[i] = { ...real[0], eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
    }
    window.__probe = { ticks: [], scrollTopAtRender: null, savedScroll: null };
    v.eventGroups = arr;
    v.filterAndRender();
    window.__probe.scrollTopAtRender = Math.round(list.scrollTop);
    window.__probe.savedScroll = v.lastListScrollTop !== undefined ? v.lastListScrollTop : 'n/a';
    const iv = setInterval(() => {
        const rows = list.querySelectorAll('.video-card');
        const first = rows.length ? rows[0].dataset.listIndex : null;
        const last = rows.length ? rows[rows.length - 1].dataset.listIndex : null;
        window.__probe.ticks.push([Math.round(performance.now() - window.__probe.t0),
            rows.length, Math.round(list.scrollTop), l.listTop, l.listEnd, first, last]);
        if (window.__probe.ticks.length > 30) clearInterval(iv);
    }, 100);
    window.__probe.t0 = performance.now();
    return { started: true };
})());

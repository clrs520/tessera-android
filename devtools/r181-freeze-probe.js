// R181 · who moves scrollTop? Freeze the deferred fill so only the synchronous placeWindow runs,
// then watch the scroll offset for two seconds. If it still climbs, something outside the window
// code is scrolling the list; if it holds, the climb belongs to the fill.
(() => {
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
    const out = { ticks: [], saved: [], realScrollTop: l ? 'n/a' : 'n/a' };
    l.scheduleWindowFill = function () { out.saved.push(['fill-blocked', this.listTop, this.listEnd]); };
    let events = 0;
    const onScroll = () => { events += 1; out.saved.push(['scroll', Math.round(list.scrollTop), list.querySelectorAll('.video-card').length]); };
    list.addEventListener('scroll', onScroll);
    out.beforeRender = Math.round(list.scrollTop);
    v.eventGroups = arr;
    v.filterAndRender();
    out.afterRender = Math.round(list.scrollTop);
    out.active = document.activeElement ? (document.activeElement.className || document.activeElement.tagName) : null;
    out.t0 = performance.now();
    const iv = setInterval(() => {
        const rows = list.querySelectorAll('.video-card');
        out.ticks.push([Math.round(performance.now() - out.t0), rows.length,
            Math.round(list.scrollTop), l.listTop, l.listEnd, Math.round(list.scrollHeight)]);
        if (out.ticks.length > 18) {
            clearInterval(iv);
            list.removeEventListener('scroll', onScroll);
            delete l.scheduleWindowFill;   // the instance override goes, the prototype stays
            out.scrollEvents = events;
            window.__r181freeze = out;
            v.eventGroups = real;
            v.filterAndRender();
        }
    }, 120);
    return JSON.stringify({ started: true });
})();

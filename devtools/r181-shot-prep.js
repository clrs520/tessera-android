// R181 · leaves the windowed list on screen at a deep jump so a screenshot can show what the
// criteria measured. Restore with `--file devtools/r181-shot-restore.js`.
JSON.stringify((() => {
    const v = window.viewer, list = v.dom.fileList, l = v.videoListComponent;
    const real = v.eventGroups;
    if (!window.__r181real) window.__r181real = real;
    const TOTAL = 3000;
    const base = Date.parse('2026-09-01T08:00:00Z');
    const p = (x) => String(x).padStart(2, '0');
    const arr = new Array(TOTAL);
    for (let i = 0; i < TOTAL; i += 1) {
        const t = new Date(base - i * 60000);
        const stamp = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}_${p(t.getHours())}-${p(t.getMinutes())}-00`;
        arr[i] = { ...real[0], eventId: `synthetic/${i}#${stamp}`, startTime: stamp, name: `S${i}` };
    }
    // Conditional, never a bare toggle: the drawer is already open in a normal session and toggling
    // it would shut the sheet this screenshot is supposed to show.
    if (list.getBoundingClientRect().left < -1 && typeof v.toggleSidebar === 'function') {
        v.toggleSidebar(true);
    }
    v.eventGroups = arr;
    list.scrollTop = 0;
    v.filterAndRender();
    // Jump to event 1350 the way the criteria do. Everything the window does next happens in the
    // scroll handler, i.e. after this call returns — so the state below is deliberately not read
    // here; `r181-b5-read.js`-style pings and the screenshot come after.
    setTimeout(() => { list.scrollTop = Math.round(1350 * 74); }, 400);
    const box = list.getBoundingClientRect();
    return { left: Math.round(box.left), clientH: Math.round(list.clientHeight),
        injected: TOTAL, spacers: [...list.querySelectorAll('.list-spacer')]
            .map((s) => Math.round(s.getBoundingClientRect().height)),
        sidebar: v.dom.sidebar ? v.dom.sidebar.className : null };
})());

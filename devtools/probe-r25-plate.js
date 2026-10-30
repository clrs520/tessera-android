// Round 21 item 3 re-check on the installed 1.2.2 APK: geometry of the detail-data plate,
// the column reflow it computed from its own width, whether the resize grip is reachable,
// and the internal scroll state.
(() => {
    const el = document.getElementById('metaDetailOverlay');
    if (!el) return 'no #metaDetailOverlay';
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const content = el.querySelector('.stats-content');
    const ccs = content ? getComputedStyle(content) : null;
    const grip = document.getElementById('statsResizeHandle');
    const gcs = grip ? getComputedStyle(grip) : null;
    const gr = grip ? grip.getBoundingClientRect() : null;
    const hit = gr && gr.width
        ? document.elementFromPoint(gr.x + gr.width / 2, gr.y + gr.height / 2)
        : null;
    return JSON.stringify({
        vw: innerWidth,
        vh: innerHeight,
        orientation: screen.orientation.type,
        visible: cs.display,
        plate: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        cols: (cs.getPropertyValue('--stats-cols') || ccs?.getPropertyValue('--stats-cols') || '').trim(),
        gridTracks: ccs ? ccs.gridTemplateColumns : null,
        rowCount: el.querySelectorAll('.stats-row').length,
        grip: gcs ? {
            display: gcs.display,
            w: Math.round(gr.width),
            h: Math.round(gr.height),
            touchAction: gcs.touchAction,
            hitSelf: hit ? (hit === grip || hit.closest('#statsResizeHandle') !== null) : false,
            hitTag: hit ? (hit.id || hit.className) : null,
        } : 'missing',
        scroll: content ? { top: Math.round(content.scrollTop), max: content.scrollHeight - content.clientHeight } : null,
        stored: localStorage.getItem('tdashcam.statsPlate'),
    }, null, 1);
})()

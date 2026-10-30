// Arm a pointer-event recorder on the HUD panel and on the document, so a drag that stops
// halfway can be read as an event stream instead of guessed at.
(() => {
    const el = document.getElementById('metadataPanel');
    if (!el) return 'NO panel';
    if (window.__r66log) return 'already armed';
    window.__r66log = [];
    const push = (e) => {
        if (!/^pointer/.test(e.type)) return;
        window.__r66log.push({
            t: e.type, id: e.pointerId, btn: e.buttons,
            x: Math.round(e.clientX), y: Math.round(e.clientY),
            tgt: (e.target.id || e.target.className || e.target.tagName || '').toString().slice(0, 26),
            cap: el.hasPointerCapture ? el.hasPointerCapture(e.pointerId) : null
        });
    };
    // Document capture only: it sees every event no matter which element ended up owning the
    // pointer, and listening on the panel too would log each one twice.
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((t) => {
        document.addEventListener(t, push, true);
    });
    return 'armed';
})()

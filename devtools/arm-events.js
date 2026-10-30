(() => {
    window.__ev = [];
    ['touchstart', 'pointerdown', 'mousedown', 'click'].forEach(t => {
        document.addEventListener(t, e => {
            const p = e.touches ? e.touches[0] : e;
            window.__ev.push(t + ':' + Math.round(p.clientX || 0) + ',' + Math.round(p.clientY || 0));
        }, true);
    });
    return 'ARMED';
})()

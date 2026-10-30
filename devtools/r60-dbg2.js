(() => {
    try {
        window.__dbg2 = { ev: [] };
        const log = (e) => {
            const t = e.touches ? e.touches.length : '-';
            window.__dbg2.ev.push('DOC ' + e.type + '@' + Math.round(e.clientX || (e.touches[0] && e.touches[0].clientX) || 0) + ',' +
                Math.round(e.clientY || (e.touches[0] && e.touches[0].clientY) || 0) + ' pt=' + JSON.stringify(e.pointerType) +
                ' n=' + t + ' pd=' + e.defaultPrevented);
        };
        for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) document.addEventListener(t, log, true);
        for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) document.addEventListener(t, log, true);
        // record who preventDefaults
        const pd = Event.prototype.preventDefault;
        Event.prototype.preventDefault = function () {
            if (window.__dbg2 && this.type && /touch|pointer|wheel/.test(this.type)) {
                const err = new Error();
                window.__dbg2.ev.push('PREVENT ' + this.type + ' <- ' + String(err.stack).split('\n')[2]);
            }
            return pd.apply(this, arguments);
        };
        return 'armed';
    } catch (e) { return 'THREW ' + e.message; }
})()

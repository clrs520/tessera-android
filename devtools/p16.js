(() => {
    window.__errs = window.__errs || [];
    if (!window.__errHooked) {
        window.__errHooked = true;
        window.addEventListener('unhandledrejection', e => {
            window.__errs.push({ ev: 'reject', t: Math.round(performance.now()), m: String(e.reason && (e.reason.message || e.reason) || e.reason).slice(0, 160) });
        });
        window.addEventListener('error', e => {
            window.__errs.push({ ev: 'error', t: Math.round(performance.now()), m: String(e.message).slice(0, 160), f: String(e.filename || '').split('/').pop(), ln: e.lineno });
        });
        const ow = console.warn.bind(console);
        console.warn = (...a) => { window.__errs.push({ ev: 'warn', t: Math.round(performance.now()), m: a.map(x => String(x)).join(' ').slice(0, 160) }); ow(...a); };
        const oe = console.error.bind(console);
        console.error = (...a) => { window.__errs.push({ ev: 'err', t: Math.round(performance.now()), m: a.map(x => String(x && x.message || x)).join(' ').slice(0, 160) }); oe(...a); };
    }
    return 'errs hooked';
})()

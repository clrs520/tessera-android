(() => {
    window.__bgScan = { t0: Date.now(), done: 0, ok: null, hiddenAt: 0 };
    const view = window.viewer;
    view.loadTauriDirectory('/sdcard/TeslaCamBg').then((ok) => {
        window.__bgScan.ok = ok;
        window.__bgScan.done = Date.now();
        window.__bgScan.events = view.eventGroups.length;
    }).catch((e) => {
        window.__bgScan.err = String(e && e.message || e);
        window.__bgScan.done = Date.now();
    });
    return 'started';
})()

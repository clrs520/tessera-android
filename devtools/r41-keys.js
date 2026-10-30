(() => {
    const v = window.viewer;
    const info = {};
    for (const k of Object.keys(v)) {
        const x = v[k];
        if (Array.isArray(x)) info[k] = 'array(' + x.length + ')';
        else if (x === null) info[k] = 'null';
        else info[k] = typeof x;
    }
    return JSON.stringify({ keys: info, cards: document.querySelectorAll('.video-card').length, curPath: v.lastScannedPath }, null, 1);
})()

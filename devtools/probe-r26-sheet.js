(() => {
    const panel = document.querySelector('.phone-export-panel');
    const body = document.querySelector('.pe-body');
    const btn = document.getElementById('peStartBtn');
    if (!panel || !btn) return JSON.stringify({ error: 'panel or button missing' });
    const r = btn.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const box = panel.getBoundingClientRect();
    const summary = document.getElementById('peSummary');
    const sr = summary ? summary.getBoundingClientRect() : null;
    return JSON.stringify({
        vp: [innerWidth, innerHeight],
        panel: [Math.round(box.left), Math.round(box.top), Math.round(box.width), Math.round(box.height)],
        panelScroll: { sh: panel.scrollHeight, ch: panel.clientHeight, st: panel.scrollTop, ov: getComputedStyle(panel).overflowY },
        bodyScroll: body ? { sh: body.scrollHeight, ch: body.clientHeight, st: body.scrollTop, ov: getComputedStyle(body).overflowY } : null,
        btn: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(' '),
        btnVisible: r.top >= box.top && r.bottom <= box.bottom + 0.5,
        hitSelf: !!hit && (hit === btn || btn.contains(hit) || hit.id === 'peStartBtn'),
        hitTag: hit ? (hit.id || hit.className || hit.tagName).toString().slice(0, 40) : null,
        summaryTop: sr ? Math.round(sr.top) + '..' + Math.round(sr.bottom) : null,
    }, null, 1);
})()

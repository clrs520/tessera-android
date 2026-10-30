(() => {
    const m = document.getElementById('phoneExportModal');
    const body = m.querySelector('.pe-body');
    const res = { body: body && [body.getBoundingClientRect().x | 0, body.getBoundingClientRect().y | 0, body.getBoundingClientRect().width | 0, body.getBoundingClientRect().height | 0, body.scrollTop | 0, body.scrollHeight | 0] };
    const els = {};
    m.querySelectorAll('button, [role="checkbox"], .pe-chip, .chip').forEach(el => {
        const r = el.getBoundingClientRect();
        const key = (el.id || el.className || 'el').toString().slice(0, 28) + '|' + (el.textContent || '').trim().slice(0, 10);
        els[key] = [r.x | 0, r.y | 0, r.width | 0, r.height | 0, el.className.toString().slice(0, 40)];
    });
    res.els = els;
    return JSON.stringify(res);
})()

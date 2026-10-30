(() => { try {
    const b = document.getElementById('clipBtn');
    const chain = [];
    for (let e = b; e && e !== document.documentElement; e = e.parentElement) {
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        chain.push((e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0]) + ' pe=' + cs.pointerEvents + ' vis=' + cs.visibility + ' op=' + cs.opacity + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + 'x' + Math.round(r.height) + ']');
    }
    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return JSON.stringify({ chain, hit: hit && (hit.id || hit.className) });
} catch (e) { return 'THREW ' + e.message; } })()

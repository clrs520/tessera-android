// R102 follow-up: is the ⋮ panel's 13.9 px really a containing-block problem, or did I measure it
// mid-entry? R97 already logged this trap (`transition` makes the rect read a slide's middle). Poll
// the transform to rest, then measure — and name every ancestor that carries a transform/filter,
// because that is what would actually re-anchor a `position:fixed` box.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const p = document.getElementById('headerActionsGroup');
    document.querySelector('.header-right')?.classList.add('active');
    let settled = false, tries = 0, t = '';
    for (let i = 0; i < 40; i += 1) {
        await sleep(200); tries = i;
        const cs = getComputedStyle(p);
        t = cs.transform;
        if (+cs.opacity === 1 && (t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)')) { settled = true; break; }
    }
    const cs = getComputedStyle(p);
    const b = p.getBoundingClientRect();
    const want = parseFloat(cs.bottom);
    const anchors = [];
    let n = p.parentElement;
    while (n) {
        const s = getComputedStyle(n);
        const flags = [];
        if (s.transform !== 'none') flags.push(`transform=${s.transform}`);
        if (s.filter && s.filter !== 'none') flags.push(`filter=${s.filter}`);
        if (s.backdropFilter && s.backdropFilter !== 'none') flags.push('backdrop-filter');
        if (s.perspective !== 'none') flags.push('perspective');
        if (s.contain && /paint|layout|strict/.test(s.contain)) flags.push(`contain=${s.contain}`);
        if (flags.length) anchors.push(`${n.tagName}.${(n.className || '').toString().split(' ')[0]} {${flags.join(' ')}}`);
        n = n.parentElement;
    }
    const bar = document.querySelector('.phone-action-bar').getBoundingClientRect();
    document.querySelector('.header-right')?.classList.remove('active');
    return JSON.stringify({
        settled, tries, transform: t, opacity: cs.opacity, position: cs.position,
        cssBottom: want, measuredInset: +(innerHeight - b.bottom).toFixed(1),
        diff: +((innerHeight - b.bottom) - want).toFixed(1),
        actionH: cs.getPropertyValue('--action-h').trim(),
        barTop: +bar.top.toFixed(1), barH: +bar.height.toFixed(1),
        impliedFromBar: +(innerHeight - bar.top).toFixed(1),
        ancestorsThatCouldReanchor: anchors,
    }, null, 1);
})()

(() => {
    const ov = document.getElementById('androidDirModal');
    const c = ov.querySelector('.modal-content');
    const q = id => document.getElementById(id);
    const vis = e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    const bad = [];
    ov.querySelectorAll('*').forEach(e => {
        const r = e.getBoundingClientRect();
        if (e.scrollWidth > e.clientWidth + 1 || r.left < -0.5 || r.right > innerWidth + 0.5) {
            bad.push(((e.id || e.className || e.tagName).toString().slice(0, 26)) + ':' + e.scrollWidth + '/' + e.clientWidth + '@' + Math.round(r.left) + '-' + Math.round(r.right));
        }
    });
    const l = q('androidDirList');
    return JSON.stringify({
        v: [innerWidth, innerHeight],
        cls: document.documentElement.className,
        panel: box(c).concat([c.scrollWidth + '/' + c.clientWidth, c.scrollHeight + '/' + c.clientHeight]),
        row: box(document.querySelector('.dir-path-row')),
        up: [vis(q('androidDirUpBtn'))].concat(box(q('androidDirUpBtn'))),
        where: box(q('androidDirWhere')) + '|' + q('androidDirWhereName').textContent + '|' + q('androidDirWherePath').scrollWidth + '/' + q('androidDirWherePath').clientWidth,
        edit: [vis(q('androidDirPathEdit')), q('androidDirPathEdit').textContent].concat(box(q('androidDirPathEdit'))),
        go: vis(q('androidDirGoBtn')), input: vis(q('androidDirPathInput')), label: vis(q('androidDirPathLabel')),
        chips: [vis(q('androidDirVolumes')), box(q('androidDirVolumes'))],
        hint: [q('androidDirHint').style.display, q('androidDirHintTitle').textContent, q('androidDirHintBody').textContent.slice(0, 24)],
        det: [vis(q('androidDirHintDetails')), q('androidDirHintDetails').textContent, vis(q('androidDirHintError'))],
        list: [l.children.length, box(l), l.scrollHeight + '/' + l.clientHeight],
        sel: box(q('androidDirSelectBtn')),
        app: [box(q('androidDirAppBtn')), getComputedStyle(q('androidDirAppBtn').parentElement).flexDirection],
        bad: bad
    });
})()

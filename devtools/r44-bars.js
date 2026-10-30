(() => {
    const o = {};
    ['tapBehaviorChoice', 'themeChoice'].forEach(id => {
        const r = document.getElementById(id);
        const bb = r.getBoundingClientRect();
        const ic = r.querySelector('.btn-icon svg');
        const lab = r.querySelector('.choice-label');
        const track = r.querySelector('.choice-segments');
        const on = r.querySelector('.choice-segment.on');
        const cs = on ? getComputedStyle(on) : null;
        o[id] = {
            rect: [Math.round(bb.x), Math.round(bb.y), Math.round(bb.width), Math.round(bb.height)],
            icon: Math.round(ic.getBoundingClientRect().width),
            label: lab.textContent.trim() + '@' + Math.round(lab.getBoundingClientRect().x),
            track: [Math.round(track.getBoundingClientRect().x), Math.round(track.getBoundingClientRect().width)],
            segs: [...r.querySelectorAll('.choice-segment')].map(s => Math.round(s.getBoundingClientRect().width)),
            on: on ? on.textContent.trim() : null,
            onStyle: cs ? cs.backgroundColor + '/' + cs.color + '/fw' + cs.fontWeight : null,
            clip: [...r.querySelectorAll('.choice-segment')].map(s => s.scrollWidth - Math.floor(s.getBoundingClientRect().width))
        };
    });
    return JSON.stringify(o, null, 1);
})()

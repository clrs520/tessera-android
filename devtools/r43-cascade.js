(() => {
    const seg = document.querySelector('#tapBehaviorChoice .choice-segment');
    const row = document.getElementById('tapBehaviorChoice');
    if (!seg) return 'no seg';
    const cs = getComputedStyle(seg), rs = getComputedStyle(row);
    return JSON.stringify({
        seg: { w: cs.width, h: cs.height, bg: cs.backgroundColor, radius: cs.borderRadius, jc: cs.justifyContent, color: cs.color, fw: cs.fontWeight, fs: cs.fontSize, pad: cs.padding },
        row: { display: rs.display, pad: rs.padding, minH: rs.minHeight, w: rs.width },
    });
})()

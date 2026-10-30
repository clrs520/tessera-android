(() => {
    const g = document.getElementById('headerActionsGroup');
    const hr = document.getElementById('headerRight');
    const R = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)].join(','); };
    const cs = el => getComputedStyle(el);
    const out = [];
    out.push('orient=' + screen.orientation.type + ' view=' + innerWidth + 'x' + innerHeight + ' cls=' + hr.className);
    const gc = cs(g);
    out.push('panel ' + R(g) + ' cols=' + gc.gridTemplateColumns + ' disp=' + gc.display
        + ' scroll=[' + g.scrollHeight + ',' + g.clientHeight + '] fits=' + (g.scrollHeight <= g.clientHeight));
    const firstText = [...g.querySelectorAll('button .btn-text')].find(t => t.getBoundingClientRect().width > 0);
    out.push('textColumn x=' + (firstText ? Math.round(firstText.getBoundingClientRect().x) : 'n/a'));
    [...g.children].forEach(el => {
        const b = el.getBoundingClientRect();
        if (!b.width && !b.height) return;
        const t = el.querySelector('.btn-text');
        const svg = el.querySelector('.btn-icon svg');
        let line = String(el.id || el.className).slice(0, 22).padEnd(22) + ' ' + R(el).padEnd(16);
        if (t) line += ' txt=' + Math.round(t.getBoundingClientRect().width) + 'px clip=' + (t.scrollWidth - t.clientWidth);
        if (svg) {
            const s = cs(svg);
            line += ' icon=' + s.width + '/' + s.stroke + '/fill=' + s.fill;
        }
        const label = el.querySelector('.choice-label');
        if (label) {
            const on = el.querySelector('.choice-segment.on');
            const ocs = on ? cs(on) : null;
            line += ' | label="' + label.textContent.trim() + '"@' + Math.round(label.getBoundingClientRect().x)
                + ' segs=[' + [...el.querySelectorAll('.choice-segment')].map(s => Math.round(s.getBoundingClientRect().width)).join(',') + ']'
                + ' on=' + (on ? '"' + on.textContent.trim() + '" bg=' + ocs.backgroundColor + ' fg=' + ocs.color + ' fw=' + ocs.fontWeight : 'NONE')
                + ' track=' + R(el.querySelector('.choice-segments')) + ' pad=' + cs(el).paddingLeft + '/' + cs(el).paddingRight;
        }
        out.push(line);
    });
    const banner = document.querySelector('.error-banner, #errorBanner');
    out.push('banner=' + (banner && cs(banner).display !== 'none' ? banner.textContent.trim().slice(0, 80) : 'none'));
    out.push('tapBehavior=' + localStorage.getItem('tdashcam.tapBehavior') + ' themeMode=' + localStorage.getItem('tdashcam.themeMode')
        + ' theme=' + document.body.classList.contains('dark-theme'));
    return out.join('\n');
})()

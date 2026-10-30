(() => {
    const pick = (sel, props) => {
        const els = document.querySelectorAll(sel);
        if (!els.length) return { sel, count: 0 };
        const s = getComputedStyle(els[0]);
        const o = { sel, count: els.length };
        for (const p of props) o[p] = s.getPropertyValue(p).trim().replace(/\s+/g, ' ').slice(0, 60);
        return o;
    };
    return JSON.stringify([
        pick('.dir-browser-item', ['border-radius', 'border-left-width', 'background-color']),
        pick('.dir-browser-more', ['border-radius', 'border-color', 'background-color']),
        pick('.dir-browser-hint', ['border-radius', 'border-left-color', 'background-color']),
        pick('#androidDirSelectBtn', ['background-image', 'background-color']),
        pick('.phone-export-panel', ['border-radius']),
        pick('#peStartBtn', ['background-image', 'background-color'])
    ]);
})()

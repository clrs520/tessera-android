(() => {
    const plate = document.getElementById('metaDetailOverlay');
    const b = plate.getBoundingClientRect();
    const handles = [...plate.querySelectorAll('*')]
        .filter((e) => /resize|handle|grip/i.test(e.className + ''))
        .map((e) => {
            const h = e.getBoundingClientRect();
            return {
                cls: (e.className || '').toString().slice(0, 40),
                x: Math.round(h.left + h.width / 2),
                y: Math.round(h.top + h.height / 2),
                w: Math.round(h.width),
                h: Math.round(h.height),
                rightGap: Math.round(innerWidth - h.right),
                bottomGap: Math.round(innerHeight - h.bottom),
            };
        });
    return JSON.stringify({
        box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
        rightGap: Math.round(innerWidth - b.right),
        handles,
        cols: plate.style.getPropertyValue('--stats-cols') || null,
        stored: localStorage.getItem('tdashcam-stats-geom') || Object.keys(localStorage).filter(k => /stats|meta/i.test(k)).join(','),
    }, null, 1);
})()

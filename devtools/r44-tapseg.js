(() => {
    const row = document.querySelector('#tapBehaviorChoice');
    const out = [];
    row.querySelectorAll('.choice-segment').forEach(b => {
        const r = b.getBoundingClientRect();
        out.push({t: b.textContent.trim(), dev: [Math.round((r.x + r.width/2) * devicePixelRatio), Math.round((r.y + r.height/2) * devicePixelRatio)], on: b.getAttribute('aria-checked')});
    });
    return JSON.stringify(out);
})()

(() => {
    const b = document.getElementById('langToggleBtn');
    const r = b.getBoundingClientRect();
    return JSON.stringify({ x: Math.round((r.x + r.width / 2) * devicePixelRatio), y: Math.round((r.y + r.height / 2) * devicePixelRatio) });
})()

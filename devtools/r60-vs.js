(() => {
    try {
        const btns = [...document.querySelectorAll('#viewSwitcher .view-btn')].map(b => {
            const r = b.getBoundingClientRect();
            return {
                t: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 10),
                on: b.classList.contains('active'),
                c: r.width > 0 ? [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)] : null,
            };
        });
        return JSON.stringify({
            layout: viewer.videoControls.layoutMode,
            vsVisible: getComputedStyle(document.getElementById('viewSwitcher')).display,
            btns,
        });
    } catch (e) { return 'THREW ' + e.message; }
})()

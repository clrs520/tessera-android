(() => { try {
    const out = [...document.querySelectorAll('#viewSwitcher .view-btn')].map(b => ({
        t: b.textContent.trim().slice(0, 6),
        on: b.classList.contains('active'),
        c: (() => { const r = b.getBoundingClientRect(); return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)]; })(),
    }));
    const cs = [...document.querySelectorAll('.video-container')].map(c => { const r = c.getBoundingClientRect(); return c.dataset.camera + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom) + ']'; });
    const ta = [...document.querySelectorAll('.video-container,.player-area,.progress-container,#viewSwitcher')].map(e => (e.className.split(' ')[0]) + '=' + getComputedStyle(e).touchAction);
    return JSON.stringify({ out, cs, ta, lm: document.querySelector('.player-area').className });
} catch (e) { return 'THREW ' + e.message; } })()

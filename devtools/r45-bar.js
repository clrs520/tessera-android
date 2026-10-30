(() => {
    const bar = document.querySelector('.phone-action-bar');
    return JSON.stringify({
        orient: screen.orientation.type, view: innerWidth+'x'+innerHeight,
        btns: [...bar.querySelectorAll('button, a')].map(b => { const r = b.getBoundingClientRect(); return {
            id: b.id, txt: (b.textContent||'').trim().slice(0,8),
            dev: [Math.round((r.x+r.width/2)*devicePixelRatio), Math.round((r.y+r.height/2)*devicePixelRatio)] }; }),
        openModals: [...document.querySelectorAll('.modal-overlay')].filter(m => getComputedStyle(m).display !== 'none').map(m => m.id)
    });
})()

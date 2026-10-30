(() => {
    const d = devicePixelRatio;
    const list = document.querySelector('.dir-browser-list');
    const r = list.getBoundingClientRect();
    const modal = document.querySelector('.dir-modal-content');
    const close = document.querySelector('#dirModal .close-modal-btn');
    const rc = close ? close.getBoundingClientRect() : null;
    const cr = document.querySelector('.dir-path-row');
    return JSON.stringify({
        list: { top: Math.round(r.top), h: Math.round(r.height), sh: list.scrollHeight, st: list.scrollTop, ov: getComputedStyle(list).overflowY },
        modal: modal ? { sh: modal.scrollHeight, ch: modal.clientHeight, st: modal.scrollTop, ov: getComputedStyle(modal).overflowY } : null,
        close: rc ? [Math.round((rc.left + rc.width / 2) * d), Math.round((rc.top + rc.height / 2) * d)] : null,
        enter: cr ? [...cr.querySelectorAll('.dir-action-btn')].map(b => { const q = b.getBoundingClientRect(); return { t: b.textContent.trim(), tap: [Math.round((q.left + q.width / 2) * d), Math.round((q.top + q.height / 2) * d)] }; }) : null,
        vh: window.innerHeight
    });
})()

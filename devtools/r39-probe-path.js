(() => {
    const d = devicePixelRatio;
    const g = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { sel, tap: [Math.round((r.left + r.width / 2) * d), Math.round((r.top + r.height / 2) * d)], value: el.value || (el.textContent || '').trim().slice(0, 20) };
    };
    return JSON.stringify([g('.dir-path-input, #dirPathInput, .dir-modal input, .dir-modal textarea'), g('.dir-enter-btn, #dirEnterBtn, .dir-modal .dir-action-btn'), g('.dir-modal-close, .dir-modal .close-modal-btn')]);
})()

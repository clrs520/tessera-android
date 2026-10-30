(() => { try {
    const fl = document.querySelector('.file-list');
    const r = fl.getBoundingClientRect();
    const ptr = document.querySelector('.pull-indicator, .ptr, .refresh-indicator, .pull-to-refresh');
    return JSON.stringify({
        rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)],
        st: Math.round(fl.scrollTop), sh: Math.round(fl.scrollHeight), ch: Math.round(fl.clientHeight),
        rows: fl.querySelectorAll('[data-event-id]').length,
        ta: getComputedStyle(fl).touchAction,
        ptr: ptr ? ptr.className + '|' + getComputedStyle(ptr).opacity + '|' + getComputedStyle(ptr).transform : 'none',
        sb: document.querySelector('.sidebar').className,
    });
} catch (e) { return 'THREW ' + e.message; } })()

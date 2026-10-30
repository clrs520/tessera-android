(() => { try {
    const P = 2.625;
    const rows = [...document.querySelectorAll('.tab-btn, .sidebar-header, .file-list, .video-card')].slice(0, 8).map(e => {
        const r = e.getBoundingClientRect();
        return { k: (e.id || String(e.className).split(' ')[0]), c: [Math.round((r.left + r.width / 2) * P), Math.round((r.top + r.height / 2) * P)], vis: getComputedStyle(e).visibility, ta: getComputedStyle(e).touchAction };
    });
    return JSON.stringify({ rows, sb: document.querySelector('.sidebar').className });
} catch (e) { return 'THREW ' + e.message; } })()

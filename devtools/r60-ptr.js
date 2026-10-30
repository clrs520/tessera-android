(() => { try {
    const s = document.getElementById('ptrSpinner');
    const fl = document.querySelector('.file-list');
    return JSON.stringify({ h: s.style.height, ready: s.classList.contains('show') || s.classList.contains('ready'), cls: s.className, st: Math.round(fl.scrollTop), skel: document.querySelectorAll('.scan-skeleton').length, sb: document.querySelector('.sidebar').className });
} catch (e) { return 'THREW ' + e.message; } })()

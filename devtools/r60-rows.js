(() => { try {
    const cards = [...document.querySelectorAll('.file-list [data-event-id]')];
    return JSON.stringify({ n: cards.length, open: cards.filter(c => c.classList.contains('swipe-open')).length, sb: document.querySelector('.sidebar').className, st: Math.round(document.querySelector('.file-list').scrollTop) });
} catch (e) { return 'THREW ' + e.message; } })()

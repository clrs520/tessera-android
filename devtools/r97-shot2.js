// open the drawer for real and say so, instead of trusting one click on a cold-starting app
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < 30 && !(v.eventGroups || []).length; i += 1) await sleep(500);
    const collapsed = () => document.querySelector('.sidebar').classList.contains('collapsed');
    if (collapsed()) { document.getElementById('tabListBtn').click(); await sleep(800); }
    if (collapsed()) { document.getElementById('openSidebarBtn')?.click(); await sleep(800); }
    return JSON.stringify({ collapsed: collapsed(), cards: document.querySelectorAll('.video-card').length,
        title: [...document.querySelectorAll('.sidebar-header .header-title span')]
            .filter(s => getComputedStyle(s).display !== 'none').map(s => s.textContent).join(',') });
})();

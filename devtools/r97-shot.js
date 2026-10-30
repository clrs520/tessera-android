// park the app in the two screens batch 2 changed: the drawer (page name) and the ⋮ panel (segments)
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const which = (globalThis.__r97shot = (globalThis.__r97shot || 0) + 1);
    if (which === 1) {
        if (document.querySelector('.sidebar').classList.contains('collapsed')) {
            document.getElementById('tabListBtn').click();
            await sleep(800);
        }
        return 'drawer';
    }
    if (document.querySelector('.sidebar').classList.contains('collapsed') === false) {
        document.getElementById('drawerDoneBtn').click();
        await sleep(700);
    }
    if (!document.querySelector('.header-right').classList.contains('active')) {
        document.getElementById('tabMoreBtn').click();
        await sleep(700);
    }
    return 'menu';
})();

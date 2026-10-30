(() => {
    const hr = document.getElementById('headerRight');
    const before = hr.className;
    document.getElementById('headerMenuBtn')?.click();
    return JSON.stringify({ before, after: hr.className, vis: getComputedStyle(document.getElementById('headerActionsGroup')).visibility });
})()

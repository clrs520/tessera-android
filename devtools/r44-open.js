(() => {
    const hr = document.getElementById('headerRight');
    const btn = document.getElementById('headerMenuBtn');
    if (!btn) return 'NO headerMenuBtn; viewer=' + !!window.viewer;
    if (!hr.className.includes('active')) btn.click();
    return JSON.stringify({ cls: hr.className, orient: screen.orientation.type, view: [innerWidth, innerHeight] });
})()

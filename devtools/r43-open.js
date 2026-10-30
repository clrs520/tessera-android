(() => {
    const hr = document.getElementById('headerRight');
    hr.classList.add('active');
    document.querySelector('.header-collapsed, .header-right')?.classList.add('header-collapsed');
    const btn = document.getElementById('headerMenuBtn') || document.querySelector('.header-menu-btn');
    if (btn) btn.click();
    return JSON.stringify({ clicked: !!btn, collapsed: document.body.className + '|' + (document.querySelector('.main-header')?.className || '') });
})()

(() => {
    const hdr = document.querySelector('.header-right');
    const panel = document.querySelector('.header-collapsed .header-actions-group');
    return JSON.stringify({
        orient: screen.orientation.type,
        view: innerWidth + 'x' + innerHeight,
        collapsed: document.body.classList.contains('header-collapsed'),
        phone: document.body.classList.contains('phone-layout'),
        themeDark: document.documentElement.getAttribute('data-theme'),
        panelOpen: !!panel,
        tapLabel: (document.querySelector('#tapChoiceLabel')||{}).textContent,
        tapMode: (window.viewer && window.viewer.tapBehavior) || null,
        firstFeedOk: !!document.querySelector('.camera-cell video')
    });
})()

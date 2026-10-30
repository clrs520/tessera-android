(() => {
    const r = (el) => el ? (({x,y,width,height}) => ({x:Math.round(x),y:Math.round(y),w:Math.round(width),h:Math.round(height)}))(el.getBoundingClientRect()) : null;
    const vis = (el) => { const c = getComputedStyle(el); return c.display !== 'none' && c.visibility !== 'hidden' && c.opacity !== '0'; };
    const filters = document.querySelector('.filters');
    return JSON.stringify({
        vp: innerWidth + 'x' + innerHeight,
        sidebar: r(document.querySelector('.sidebar')),
        sidebarHeader: r(document.querySelector('.sidebar-header')),
        filters: r(filters),
        filterGroups: [...filters.children].map((g) => ({
            cls: g.className, label: g.querySelector('label') ? g.querySelector('label').textContent : null,
            rect: r(g), controlVisible: g.querySelector('input,select') ? vis(g.querySelector('input,select')) : false,
            controlRect: r(g.querySelector('input,select')),
        })),
        filtersComputed: (({flexDirection, gap, padding}) => ({flexDirection, gap, padding}))(getComputedStyle(filters)),
        fileList: r(document.getElementById('fileList')),
        sidebarFooter: r(document.querySelector('.sidebar-footer')),
        footerButtons: [...document.querySelectorAll('.sidebar-footer button')].map((b) => ({txt: b.textContent.trim().slice(0,12), rect: r(b)})),
        cards: document.querySelectorAll('.video-card').length,
        safeVars: ['--safe-top','--safe-bottom','--safe-left','--safe-right'].map((v) => v+'='+getComputedStyle(document.documentElement).getPropertyValue(v).trim()),
    }, null, 1);
})()

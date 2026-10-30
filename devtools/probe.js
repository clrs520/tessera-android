(() => {
    const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height),
            display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
            overflowY: cs.overflowY,
        };
    };
    const videos = [...document.querySelectorAll('video')].map((v) => ({
        id: v.id,
        fit: getComputedStyle(v).objectFit,
        box: v.clientWidth + 'x' + v.clientHeight,
        src: v.videoWidth + 'x' + v.videoHeight,
        container: v.parentElement.className,
    }));
    const fileList = document.getElementById('fileList');
    return JSON.stringify({
        vp: innerWidth + 'x' + innerHeight,
        orientation: matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait',
        phoneMediaMatch: matchMedia('(max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px)').matches,
        player: document.getElementById('playerArea').className,
        sidebarOpen: document.getElementById('sidebar') ? document.getElementById('sidebar').className : null,
        dir: localStorage.getItem('tdashcam.mediaDir'),
        cards: document.querySelectorAll('.file-card').length,
        listChildren: fileList ? fileList.children.length : -1,
        rects: {
            sidebar: rect(document.getElementById('sidebar')),
            sidebarHeader: rect(document.querySelector('.sidebar-header')),
            filters: rect(document.querySelector('.filters')),
            sidebarFooter: rect(document.querySelector('.sidebar-footer')),
            fileList: rect(fileList),
            headerActions: rect(document.querySelector('.header-actions-group')),
            mainHeader: rect(document.querySelector('.main-header')),
        },
        videos,
    }, null, 1);
})()

// R119 视觉取证：把淡出单独放慢到 4s（唯一变量），好在一次 screencap 的延迟里停在中间帧上。
// 装的是 1.2.199（未修），所以中间帧应当能看到 HUD 画在还看得见的面板之上。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const sb = document.querySelector('.sidebar');
    if (sb && !sb.classList.contains('collapsed')) v.toggleSidebar(false);
    document.getElementById('r119-slow')?.remove();
    const s = document.createElement('style');
    s.id = 'r119-slow';
    s.textContent = '.header-collapsed .header-actions-group{transition: opacity 4s linear,'
        + ' transform 4s linear, visibility 0s linear 4s !important}';
    document.head.appendChild(s);
    const hr = document.getElementById('headerRight');
    hr.classList.add('active');
    await sleep(600);
    const read = () => {
        const p = getComputedStyle(document.querySelector('.header-right .header-actions-group'));
        const h = document.getElementById('metadataPanel');
        return { panelOp: p.opacity, vis: p.visibility,
            headerZ: getComputedStyle(document.querySelector('.main-header')).zIndex,
            hudZ: getComputedStyle(h).zIndex,
            hudBox: (() => { const r = h.getBoundingClientRect();
                return { w: Math.round(r.width), t: Math.round(r.top), b: Math.round(r.bottom) }; })(),
            step: window.__r119step || 'open' };
    };
    window.__r119step = 'open';
    const open = read();
    window.__r119closing = (async () => {
        await sleep(400);
        window.__r119step = 'closing';
        hr.classList.remove('active');
        return 'removed at ' + Math.round(performance.now());
    })();
    return JSON.stringify({ armed: true, open });
})()

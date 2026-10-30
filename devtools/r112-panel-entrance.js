// R112 ①：用户确认「面板一出现，它自己先浅后深 / 先透后白地变一下」。
// 这一份把「谁在变」拆开：透度（求解器写的变量）、面板自身的不透明度/变换（入场动画）、
// 以及材质（`.lens-on` 挂上 `url()` 折射的那一拍）。50ms 一采，采满 3 秒。
// 求解器先冻住 —— 上一轮我吃过亏：不冻的话 250ms 那一拍会把我的实验值写回去，量出来「什么都没变」。
(() => {
    clearInterval(glassAdaptTimer); glassAdaptTimer = 0;
    const panel = document.querySelector('.header-collapsed .header-actions-group')
        || document.querySelector('.header-actions-group');
    const bar = document.querySelector('.phone-action-bar');
    const aOf = (n) => {
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor);
        if (!m) return null;
        const p = m[1].split(',').map(parseFloat);
        return p.length >= 4 ? +p[3].toFixed(3) : 1;
    };
    window.__r112 = { t0: Date.now(), s: [], frozenAlpha: glassState.alpha };
    const tick = () => {
        const c = getComputedStyle(panel);
        window.__r112.s.push({
            t: Date.now() - window.__r112.t0,
            op: +(+c.opacity).toFixed(3),
            bg: aOf(panel),                       // 面板自己算出来的底色 alpha
            vis: c.visibility === 'hidden' ? 0 : 1,
            disp: c.display === 'none' ? 0 : 1,
            lens: panel.classList.contains('lens-on') ? 1 : 0,
            bf: /url\(/.test(c.backdropFilter || c.webkitBackdropFilter || '') ? 'LENS' : 'blur',
            tf: c.transform === 'none' ? 'none' : c.transform.slice(7, 25),
            g: +glassState.alpha.toFixed(3),      // 求解器的值（冻住后应当全程不动）
            barBg: aOf(bar),
        });
    };
    tick();
    window.__r112Timer = setInterval(tick, 50);
    return JSON.stringify({ started: true, frozenAlpha: glassState.alpha,
        panel: panel.className, transition: getComputedStyle(panel).transitionProperty + ' | ' + getComputedStyle(panel).transitionDuration });
})()

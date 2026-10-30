// R116d · 给 `--action-h` 的每一次写入装一个记录器，抓「谁在底条还挂着 transform 时量了一次」。
// 不能包 `viewer.publishControlReserve` —— ResizeObserver 直接持有那个局部闭包 `publish`，
// 换掉属性名截不到（R110 的手法在这里要往下挪一层）。这里改的是 setProperty 原型，
// 只记不判，并且把原函数留在 window.__r116orig 里，读日志时还原。
//   安装：node cdp-eval.mjs --file devtools/r116-watch.js
//   读日志：node cdp-eval.mjs --file devtools/r116-watch.js --read
(() => {
    const px = (v) => Math.round(parseFloat(v) * 10) / 10;
    const bar = () => document.getElementById('phoneActionBar');
    const truth = () => { const b = bar(); if (!b) return -1;
        const r = b.getBoundingClientRect(); return px(r.height + Math.max(0, innerHeight - r.bottom)); };
    const snap = () => { const b = bar(); return {
        declared: px(getComputedStyle(document.documentElement).getPropertyValue('--action-h') || '0'),
        truth: truth(),
        tf: b ? getComputedStyle(b).transform : 'no-bar',
        vis: b ? getComputedStyle(b).visibility : '-',
    }; };

    if (window.__r116on) {
        const raw = window.__r116log || [];
        const log = raw.map((e) => {
            const b = bar(); const r = b ? b.getBoundingClientRect() : null;
            return `@${e.t}ms 写=${e.w} 记=${e.a} 真=${e.truth} tf=${e.tf} 顶=${r ? px(r.top) : '-'}`;
        });
        if (window.__r116orig) {
            CSSStyleDeclaration.prototype.setProperty = window.__r116orig;
            delete window.__r116orig;
        }
        window.__r116on = false;
        const now = snap();
        const hit = raw.filter((e) => e.tf !== 'none' && e.tf !== 'no-bar').length;
        return JSON.stringify({
            writes: log.length, log, now,
            verdict: hit > 0
                ? `有 ${hit}/${log.length} 次写入发生在底条挂着 transform 的时候 ⇒ 记下来的数就是错的`
                : (log.length ? '写入都没撞上底条挪动 ⇒ 本场景这条路径未触发' : '一次写入都没有 ⇒ 观察窗内没人重量'),
        }, null, 1);
    }

    const orig = CSSStyleDeclaration.prototype.setProperty;
    window.__r116orig = orig;
    window.__r116log = [];
    window.__r116on = true;
    CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
        if (name === '--action-h' && window.__r116on) {
            const b = bar();
            window.__r116log.push({
                t: Math.round(performance.now()), w: value,
                a: px(value), truth: truth(),
                tf: b ? getComputedStyle(b).transform : 'no-bar',
            });
            if (window.__r116log.length > 40) window.__r116log.shift();
        }
        return orig.call(this, name, value, priority);
    };
    return JSON.stringify({ installed: true, before: snap() });
})();

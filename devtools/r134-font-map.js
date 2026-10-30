// R134 · 把某个面里每个实渲字号映射回「谁在用它」。
// 用法：先摆好那一面，再 cdp-eval --file。返回 size → [{sel, cls, text}]（每字号最多 5 条）。
// 只看有直接文字、且布局盒非零的元素；`display:none` 的子树自然被 rect 过滤掉。
(() => {
    const host = document.querySelector(window.__face || '.phone-export-panel');
    if (!host) return { error: 'no host' };
    const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };
    const out = {};
    const nodes = [host, ...host.querySelectorAll('*')];
    for (const n of nodes) {
        const own = [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent.trim()).join('');
        if (!own) continue;
        if (!vis(n)) continue;
        const cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none') continue;
        const fs = cs.fontSize;
        (out[fs] ||= []);
        if (out[fs].length >= 5) continue;
        const own2 = own.length > 18 ? own.slice(0, 18) + '…' : own;
        out[fs].push({
            tag: n.tagName.toLowerCase(),
            cls: (typeof n.className === 'string' ? n.className : '').slice(0, 64),
            text: own2,
        });
    }
    const sorted = {};
    for (const k of Object.keys(out).sort((a, b) => parseFloat(a) - parseFloat(b))) sorted[k] = out[k];
    return {
        host: host.className.slice(0, 60),
        rect: (r => [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)])(host.getBoundingClientRect()),
        sizes: sorted,
    };
})()

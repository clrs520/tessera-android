// R115 · 文字角色的普查：不猜类名 —— 把每个面里**真正有字的叶子节点**全走一遍，
// 按 (字号/字重/颜色/字距) 聚类。同一个「次要说明」角色在三个面是三个字号，这种就看得出来。
(() => {
    const CONT = {
        drawer: '.sidebar',
        panel: '.header-collapsed .header-actions-group',
        bar: '.phone-action-bar',
        export: '.phone-export-panel',
        plate: '.metadata-panel',
        menu: '.card-context-menu',
        modal: '.dir-modal-content',
        about: '.about-panel',
    };
    const lines = [];
    for (const [key, sel] of Object.entries(CONT)) {
        const root = document.querySelector(sel);
        if (!root) continue;
        const cs0 = getComputedStyle(root);
        if (cs0.display === 'none' || cs0.visibility === 'hidden' || +cs0.opacity === 0) continue;
        const g = new Map();
        for (const n of root.querySelectorAll('*')) {
            const t = (n.textContent || '').trim();
            if (!t) continue;
            if ([...n.children].some((c) => (c.textContent || '').trim())) continue;
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const sig = `fs=${cs.fontSize} fw=${cs.fontWeight} c=${cs.color}`;
            const e = g.get(sig);
            if (e) { e.n++; if (e.samp.length < 40) e.samp += '、' + (n.className || n.tagName); }
            else g.set(sig, { n: 1, samp: (n.className || n.tagName), text: t.slice(0, 8) });
        }
        if (!g.size) continue;
        lines.push(`\n[${key}]`);
        for (const [sig, o] of [...g.entries()].sort((a, b) => b[1].n - a[1].n)) {
            lines.push(`   ×${o.n} 「${o.text}」 ${sig}  {${o.samp.slice(0, 70)}}`);
        }
    }
    return lines.join('\n') || 'nothing visible';
})();

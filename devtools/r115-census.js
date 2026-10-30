// R115 · 「页面 UI 没有统一」的取证：不是猜哪块不统一，而是把每类控件在同一屏上**实际渲染成什么样**
// 全量数出来 —— 高度、圆角、字号、字重、描边、内缩，按值聚类，谁落单谁就是没统一的那个。
// 只报数值与选择器，不报任何 URL / 路径内容。
(() => {
    const num = (v) => Math.round(parseFloat(v) * 10) / 10;
    const CONT = {
        drawer: '.sidebar',
        panel: '.header-collapsed .header-actions-group',
        bar: '.phone-action-bar',
        export: '.phone-export-panel',
        plate: '.metadata-panel',
        menu: '.card-context-menu',
        modal: '.dir-modal-content',
        about: '.about-panel',
        toast: '.toast',
    };
    const out = { orient: matchMedia('(orientation: landscape)').matches ? 'land' : 'port',
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        fieldH: {}, surfaces: {}, clusters: {} };

    const selOf = (n) => (n.tagName.toLowerCase() +
        (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string'
            ? '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.') : '')).slice(0, 54);

    // 只统计「控件形状」：能点的，或自己画了圆角的。纯文字行 / 布局容器会淹掉统计。
    const isControl = (n, cs) => {
        if (n.matches('button,input,select,[role="button"],[role="tab"],[role="radio"]')) return true;
        return parseFloat(cs.borderTopLeftRadius) > 0
            && (parseFloat(cs.borderTopWidth) > 0 || cs.backgroundColor !== 'rgba(0, 0, 0, 0)');
    };

    for (const [key, rootSel] of Object.entries(CONT)) {
        const root = document.querySelector(rootSel);
        if (!root) { out.surfaces[key] = ['ABSENT']; continue; }
        out.fieldH[key] = getComputedStyle(root).getPropertyValue('--field-h').trim() || '-';
        const seen = new Set(); const rows = [];
        const lineOf = (n, cs, r) => `${selOf(n)} h=${num(r.height)} w=${num(r.width)} rad=${cs.borderTopLeftRadius}`
            + ` fs=${cs.fontSize} fw=${cs.fontWeight} pad=${cs.paddingInlineStart}~${cs.paddingInlineEnd}`
            + ` bd=${cs.borderTopWidth}${cs.borderTopStyle === 'none' ? '0' : '1'}`;
        {   // 面本身先记一行：它的圆角/底色/描边才是「这块面板长什么样」的那个数。
            const cs = getComputedStyle(root); const r = root.getBoundingClientRect();
            if (r.width >= 1 && r.height >= 1) {
                rows.push('FACE·' + lineOf(root, cs, r) + ` bg=${cs.backgroundColor}`);
            }
        }
        for (const n of root.querySelectorAll('*')) {
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const r = n.getBoundingClientRect();
            if (r.width < 1 || r.height < 1 || !isControl(n, cs)) continue;
            const line = lineOf(n, cs, r);
            if (seen.has(line)) continue;
            seen.add(line); rows.push(line);
            if (rows.length > 24) break;
        }
        out.surfaces[key] = rows;
    }

    // 聚类：某个值只有 1 个面在用 = 「这一档就它一个人这么写」的候选。
    const grab = (line, what) => {
        const m = { h: / h=([\d.]+)/, rad: /rad=(\S+)/, fs: / fs=(\S+)/, fw: / fw=(\S+)/, pad: / pad=(\S+?)~/ }[what];
        const g = line.match(m);
        return g ? g[1] : null;
    };
    for (const what of ['h', 'rad', 'fs', 'fw', 'pad']) {
        const m = {};
        for (const [key, rows] of Object.entries(out.surfaces)) {
            for (const line of rows) {
                const v = grab(line, what);
                if (!v) continue;
                (m[v] = m[v] || []).push(key + '·' + line.split(' ')[0]);
            }
        }
        out.clusters[what] = Object.entries(m).sort((a, b) => b[1].length - a[1].length)
            .map(([v, w]) => `${v} ×${w.length} ${[...new Set(w)].slice(0, 3).join(' ')}${new Set(w).size > 3 ? ' +' + (new Set(w).size - 3) : ''}`);
    }
    return JSON.stringify(out, null, 1);
})();

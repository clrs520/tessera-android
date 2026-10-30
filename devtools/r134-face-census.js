// R134 · 逐面字号普查（基线/复测共用）。有直接文字、非 emoji 图标的叶子才计数。
// 数据卡片单独一栏、只记不判（用户 2026-10-21：「数据卡片就不动」）。
(() => {
    const faces = [
        ['抽屉', '.sidebar'],
        ['⋮面板', '#headerActionsGroup'],
        ['底部条', '.phone-action-bar'],
        ['导出页', '.phone-export-panel'],
        ['长按菜单', '.card-context-menu'],
        ['找片卡', '.empty-hero'],
        ['关于页', '.about-panel'],
        ['手势页', '.gesture-panel'],
        ['目录浏览器', '.dir-modal-content'],
        ['预览放大页', '#peZoomModal'],
        ['路径弹窗', '#filePathModal'],
        ['数据卡片', '#metadataPanel'],
    ];
    const skip = (n) => /emoji/i.test(typeof n.className === 'string' ? n.className : '');
    const out = {};
    for (const [name, sel] of faces) {
        const host = document.querySelector(sel);
        if (!host) { out[name] = 'absent'; continue; }
        const map = {};
        for (const n of [host, ...host.querySelectorAll('span,div,button,a,label,h1,h2,h3,h4,p')]) {
            if (!(n.textContent || '').trim()) continue;
            if (n.children.length && ![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
            if (skip(n)) continue;
            const fs = getComputedStyle(n).fontSize;
            if (!(parseFloat(fs) > 0)) continue;
            (map[fs] ||= []);
            if (map[fs].length < 2) {
                map[fs].push(((typeof n.className === 'string' ? n.className : '') || n.tagName).slice(0, 28)
                    + '「' + (n.textContent || '').trim().slice(0, 10) + '」');
            }
        }
        const keys = Object.keys(map).sort((a, b) => parseFloat(a) - parseFloat(b));
        out[name] = { n: keys.length, sizes: keys.join('/'), eg: keys.map((k) => k + '=' + map[k][0]).join(' | ') };
    }
    return out;
})()

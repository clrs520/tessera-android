// R125 · 「质感统一」的四本账：圆角 / 描边 / 字号 / 材质底。
// 只在**当前这一屏**能看到的面上量；每个面取它自己的容器与第一行，避免把整棵树倒出来。
(() => {
    const faces = [
        ['抽屉面板', '.sidebar'],
        ['抽屉行', '.sidebar .video-card'],
        ['抽屉搜索框', '.sidebar #eventSearch'],
        ['日期 chip', '.sidebar .date-chip'],
        ['⋮面板', '#headerActionsGroup'],
        ['⋮面板行', '#headerActionsGroup .control-btn'],
        ['⋮分段', '#headerActionsGroup .choice-segments'],
        ['底部条', '.phone-action-bar'],
        ['数据卡片', '#metadataPanel'],
        ['找片卡片', '.player-area.empty .empty-hero'],
    ];
    const row = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
            sel,
            radius: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].join(' '),
            border: `${cs.borderTopWidth}/${cs.borderRightWidth}/${cs.borderBottomWidth}/${cs.borderLeftWidth}`,
            borderColor: cs.borderTopColor,
            bg: cs.backgroundColor,
            blur: (cs.backdropFilter || 'none').replace(/url\([^)]*\)\s*/, '').slice(0, 40),
            shadow: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 34),
            fontSize: cs.fontSize,
        };
    };
    const out = { orient: innerWidth > innerHeight ? 'landscape' : 'portrait', faces: [] };
    for (const [name, sel] of faces) {
        const r = row(sel);
        out.faces.push(r ? { name, ...r } : { name, sel, absent: true });
    }
    // 字号：把每个面的**文字叶子**实渲字号聚类（同一面里出现几种字号 = 这本账有几行）
    const sizes = {};
    for (const [name, sel] of faces) {
        const host = document.querySelector(sel);
        if (!host) continue;
        const set = new Set();
        for (const n of [host, ...host.querySelectorAll('span, div, button, a, label')]) {
            if (!(n.textContent || '').trim()) continue;
            if (n.children.length && ![...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
            const fs = getComputedStyle(n).fontSize;
            if (parseFloat(fs) > 0) set.add(fs);
        }
        sizes[name] = [...set].sort((a, b) => parseFloat(a) - parseFloat(b));
    }
    out.fontSizes = sizes;
    return out;
})()

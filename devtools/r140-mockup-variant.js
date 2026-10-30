// R140 mockup: inject one landscape split + height-reclaim variant into the live export page,
// then report the geometry. Usage: r140-mockup-variant.js <ratio>   ratio = 1.6 | 2
// No source files are touched; the injected style is tagged #r140Mock so it can be removed.
(async () => {
    const ratio = String(Number(window.__r140Ratio || 1.6));
    document.getElementById('r140Mock')?.remove();
    const dock = document.querySelector('.phone-export-page .pe-preview-dock');
    const label = dock?.querySelector('.pe-dock-head .pe-label');
    const cap = document.querySelector('.phone-export-page .pe-preview-cap');
    // Keep the caption text, put it in the head's now-redundant 「预览」 slot. 「合成预览 · 」 is
    // dropped only for width; the frame itself is self-evidently a preview in this dock.
    const shortCap = (cap?.textContent || '')
        .replace(/^合成预览\s*·\s*/, '')
        .replace(/^从\s*/, '起点 ')
        .replace(/\s*起\s*·\s*/, ' · ')
        .replace(/文件\s*/, '')
        .replace(/标记占画面\s*/, '标记 ');
    if (label && shortCap) {
        if (!window.__r140Label) window.__r140Label = label.textContent;
        label.textContent = shortCap;
    }
    const style = document.createElement('style');
    style.id = 'r140Mock';
    style.textContent = `
        .phone-export-page .phone-export-panel {
            grid-template-columns: minmax(0, ${ratio}fr) minmax(0, 1fr);
        }
        .phone-export-page .pe-seg { margin-top: 6px; margin-bottom: 8px; }
        .phone-export-page .pe-preview-dock .pe-preview {
            margin: 0 auto;
            max-height: calc(100% - 42px);
        }
        .phone-export-page .pe-preview-cap { display: none; }
    `;
    document.head.appendChild(style);
    await new Promise((r) => setTimeout(r, 350));
    const q = (s) => document.querySelector('.phone-export-page ' + s);
    const box = (n) => n ? {
        x: Math.round(n.getBoundingClientRect().x), y: Math.round(n.getBoundingClientRect().y),
        w: Math.round(n.getBoundingClientRect().width), h: Math.round(n.getBoundingClientRect().height),
    } : null;
    const panel = q('.phone-export-panel');
    const canvas = q('.pe-preview');
    const head = q('.pe-dock-head');
    const labelEl = head?.querySelector('.pe-label');
    const dockBox = box(q('.pe-preview-dock'));
    const cv = box(canvas);
    return JSON.stringify({
        ratio,
        vp: [innerWidth, innerHeight],
        cols: getComputedStyle(panel).gridTemplateColumns,
        body: box(q('.pe-body')), dock: dockBox,
        seg: box(q('.pe-seg')), sum: box(q('.pe-summary')),
        canvas: cv,
        ratioShown: cv && cv.h ? +(cv.w / cv.h).toFixed(3) : null,
        natRatio: canvas ? +(canvas.width / canvas.height).toFixed(3) : null,
        head: box(head),
        label: labelEl?.textContent,
        labelW: labelEl ? Math.round(labelEl.getBoundingClientRect().width) : null,
        headW: head ? Math.round(head.getBoundingClientRect().width) : null,
        fill: cv && dockBox ? +(100 * (cv.w * cv.h) / (dockBox.w * dockBox.h)).toFixed(1) : null,
    });
})()

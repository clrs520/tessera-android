// R99-1c: the first truncation check was blind. `n.scrollWidth > n.clientWidth` only catches a label
// that overflows *itself*; here `.btn-text` is a nowrap box inside a flex row that clips it, so the
// element reports no overflow while the picture shows 「连续播放：…」. Measure the text's own painted
// width with a Range and compare it to the box it was laid out in — then find the row spacing that
// lets a 118 px cell hold a six-character label without giving up the zero-scroll seven-column grid.
(async () => {
    const panel = document.getElementById('headerActionsGroup');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const SEL = '.header-collapsed .header-right .header-actions-group';
    const style = document.createElement('style');
    document.head.appendChild(style);

    const textW = n => {
        const r = document.createRange();
        r.selectNodeContents(n);
        return r.getBoundingClientRect().width;
    };
    const ellipsised = () => [...panel.querySelectorAll('.btn-text, .choice-label')]
        .filter(n => {
            const box = n.getBoundingClientRect().width;
            return textW(n) > box + 1;
        })
        .map(n => `${(n.textContent || '').trim().slice(0, 10)}(${Math.round(textW(n))}>${Math.round(n.getBoundingClientRect().width)})`);

    const apply = (extra, divH) => {
        style.textContent = `
            ${SEL} { bottom: calc(var(--action-h) + 12px) !important;
                     max-height: calc(var(--viewport-h) - var(--action-h) - 40px - var(--safe-top)) !important;
                     grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)) !important;
                     width: calc(100vw - 12px - var(--safe-left) - var(--safe-right)) !important; }
            ${SEL} .menu-divider { display: flex !important; grid-column: 1 / -1 !important; height: ${divH}px !important; }
            ${SEL} .lang-toggle-btn { grid-column: span 2 !important; }
            ${extra}`;
    };

    const read = async (name, extra, divH = 15) => {
        apply(extra, divH);
        panel.scrollTop = 0;
        await sleep(220);
        const cols = getComputedStyle(panel).gridTemplateColumns.split(' ').filter(Boolean);
        const pr = panel.getBoundingClientRect();
        const clipped = [...panel.children].filter(n => {
            const r = n.getBoundingClientRect();
            return r.height > 4 && (r.bottom > pr.bottom + 1 || r.top < pr.top - 1);
        }).length;
        const texts = [...panel.querySelectorAll('.btn-text')].filter(n => n.textContent.trim());
        const widest = Math.max(...texts.map(n => Math.round(textW(n))));
        return { name, cols: cols.length, cellW: Math.round(parseFloat(cols[0])),
            content: panel.scrollHeight, client: panel.clientHeight,
            over: panel.scrollHeight - panel.clientHeight, clipped,
            widestLabel: widest, ellipsised: ellipsised() };
    };

    const out = { viewport: `${innerWidth}x${innerHeight}`, variants: [] };
    out.variants.push(await read('shipped (pad 7, gap 6)', ''));
    out.variants.push(await read('pad 5, gap 4', `${SEL} > button, ${SEL} > a { padding: 0 5px !important; gap: 4px !important; }`));
    out.variants.push(await read('pad 4, gap 3', `${SEL} > button, ${SEL} > a { padding: 0 4px !important; gap: 3px !important; }`));
    out.variants.push(await read('pad 4, gap 3, icon 16', `${SEL} > button, ${SEL} > a { padding: 0 4px !important; gap: 3px !important; }
        ${SEL} .btn-icon { width: 16px !important; height: 16px !important; }`));
    out.variants.push(await read('6 cols, div 11, gap 1', `
        ${SEL} { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; gap: 1px !important; }
        ${SEL} > button, ${SEL} > a { padding: 0 6px !important; }`, 11));
    style.remove();
    return out;
})()

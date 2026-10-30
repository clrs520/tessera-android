// R99-1e: pick the landscape grid on measured slack, not on a tolerance. `clientWidth` is floored, so a
// 74.2 px box holding 74.9 px of text reads as "0.9 over" here and as 「连续播放：…」 on screen — the
// ellipsis needs a whole glyph of room to disappear, so anything within ~1 px is a coin flip against
// the device's font metrics. Every candidate is measured with fractional boxes and reported as the
// worst label deficit plus the height arithmetic.
(async () => {
    const p = document.getElementById('headerActionsGroup');
    const SEL = '.header-collapsed .header-right .header-actions-group';
    const cs = n => getComputedStyle(n);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const st = document.createElement('style');
    document.head.appendChild(st);
    for (let i = 0; i < 30 && +cs(p).opacity !== 1; i++) {
        if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
        await sleep(250);
    }
    const cap = slack => `${SEL} { bottom: calc(var(--action-h) + 12px) !important;
        max-height: calc(var(--viewport-h) - var(--action-h) - ${slack}px - var(--safe-top)) !important; }`;
    const probe = async (label, css) => {
        st.textContent = css;
        await sleep(280);
        const texts = [...p.querySelectorAll('.btn-text')].filter(n => n.textContent.trim());
        const rows = texts.map(n => {
            const rg = document.createRange();
            rg.selectNodeContents(n);
            return { txt: n.textContent.trim().slice(0, 9), need: rg.getBoundingClientRect().width, got: n.getBoundingClientRect().width };
        });
        const short = rows.filter(r => r.need > r.got + 0.3);
        const cols = cs(p).gridTemplateColumns.split(' ').filter(Boolean);
        const pr = p.getBoundingClientRect();
        const clipped = [...p.children].filter(n => {
            const r = n.getBoundingClientRect();
            return r.height > 4 && (r.bottom > pr.bottom + 1 || r.top < pr.top - 1);
        }).length;
        return { label, cols: cols.length, cellW: +parseFloat(cols[0]).toFixed(1),
            worstDeficit: +Math.max(...rows.map(r => r.need - r.got)).toFixed(1),
            minSlack: +Math.min(...rows.map(r => r.got - r.need)).toFixed(1),
            // The three rows closest to their box, so the binding constraint is named rather than guessed.
            tightest: rows.map(r => ({ t: r.txt, s: +(r.got - r.need).toFixed(1) }))
                .sort((a, b) => a.s - b.s).slice(0, 3).map(r => `${r.t}+${r.s}`).join(' '),
            ellipsised: short.length, examples: short.slice(0, 3).map(r => `${r.txt} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`),
            content: p.scrollHeight, client: p.clientHeight, over: p.scrollHeight - p.clientHeight, clipped };
    };
    const seven = `${SEL} { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)) !important; width: calc(100vw - 12px - var(--safe-left) - var(--safe-right)) !important; }`;
    const six = `${SEL} { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important; width: calc(100vw - 12px - var(--safe-left) - var(--safe-right)) !important; }`;
    const div = h => `${SEL} .menu-divider { display: flex !important; grid-column: 1 / -1 !important; height: ${h}px !important; margin-top: 1px !important; }`;
    const span = `${SEL} .lang-toggle-btn { grid-column: span 2 !important; }`;
    const row = (pad, gap, icon) => `${SEL} > button, ${SEL} > a { padding: 0 ${pad}px !important; gap: ${gap}px !important; }
        ${SEL} .btn-icon { width: ${icon}px !important; height: ${icon}px !important; }`;

    const out = { viewport: `${innerWidth}x${innerHeight}`, variants: [] };
    out.variants.push(await probe('A shipped: 7 cols, pad7 gap6 icon18', `${cap(40)}${seven}${div(15)}${span}`));
    out.variants.push(await probe('B 7 cols, pad5 gap4 icon16', `${cap(40)}${seven}${div(15)}${span}${row(5, 4, 16)}`));
    out.variants.push(await probe('C 7 cols, pad4 gap3 icon16', `${cap(40)}${seven}${div(15)}${span}${row(4, 3, 16)}`));
    out.variants.push(await probe('D 6 cols, pad7 gap6 icon18, div12, slack32', `${cap(32)}${six}${div(12)}${span}`));
    out.variants.push(await probe('E 6 cols, pad6 gap5 icon18, div12, slack28', `${cap(28)}${six}${div(12)}${span}${row(6, 5, 18)}`));
    out.variants.push(await probe('F 6 cols, pad7 gap6 icon18, div12, slack24', `${cap(24)}${six}${div(12)}${span}`));
    // Prefer spending the row's padding over shrinking the glyph: 18 px is what the upright panel uses
    // and an icon that changes size with orientation is its own inconsistency.
    out.variants.push(await probe('G 7 cols, pad5 gap4 icon18', `${cap(40)}${seven}${div(15)}${span}${row(5, 4, 18)}`));
    out.variants.push(await probe('H 7 cols, pad4 gap4 icon18', `${cap(40)}${seven}${div(15)}${span}${row(4, 4, 18)}`));
    out.variants.push(await probe('I 7 cols, pad4 gap3 icon18', `${cap(40)}${seven}${div(15)}${span}${row(4, 3, 18)}`));
    out.variants.push(await probe('J 7 cols, pad3 gap3 icon18', `${cap(40)}${seven}${div(15)}${span}${row(3, 3, 18)}`));
    st.remove();
    return out;
})()

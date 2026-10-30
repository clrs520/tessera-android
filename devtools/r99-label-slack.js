// R99-1d: the labels are 1 px short of fitting, which is enough for the browser to paint
// 「连续播放：…」 and enough for a `scrollWidth > clientWidth + 1` assertion to call it clean. Measure
// the actual deficit per row (`Range` width minus the box the label was given) for each candidate row
// spacing, so the fix is chosen on slack rather than on a tolerance that hides the bug.
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
    const probe = async (label, css) => {
        st.textContent = css;
        await sleep(260);
        const texts = [...p.querySelectorAll('.btn-text')].filter(n => n.textContent.trim());
        const rows = texts.map(n => {
            const rg = document.createRange();
            rg.selectNodeContents(n);
            return { txt: n.textContent.trim().slice(0, 8), need: +rg.getBoundingClientRect().width.toFixed(1), got: n.clientWidth };
        });
        const short = rows.filter(r => r.need > r.got + 0.2);
        return { label, cols: cs(p).gridTemplateColumns.split(' ').filter(Boolean).length,
            worstDeficit: +Math.max(...rows.map(r => r.need - r.got)).toFixed(1),
            ellipsised: short.length, examples: short.slice(0, 4).map(r => `${r.txt} ${r.need}>${r.got}`),
            content: p.scrollHeight, client: p.clientHeight };
    };
    const out = { viewport: `${innerWidth}x${innerHeight}`, variants: [] };
    out.variants.push(await probe('shipped pad 7 / gap 6', ''));
    out.variants.push(await probe('pad 5 / gap 4', `${SEL} > button, ${SEL} > a { padding: 0 5px !important; gap: 4px !important; }`));
    out.variants.push(await probe('pad 4 / gap 4', `${SEL} > button, ${SEL} > a { padding: 0 4px !important; gap: 4px !important; }`));
    out.variants.push(await probe('pad 5 / gap 4, font .74rem', `${SEL} > button, ${SEL} > a { padding: 0 5px !important; gap: 4px !important; font-size: 0.74rem !important; }`));
    st.remove();
    return out;
})()

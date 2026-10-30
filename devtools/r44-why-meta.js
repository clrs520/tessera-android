(() => {
    const a = document.getElementById('metaSwitchBtn');
    const b = document.getElementById('metaDetailBtn');
    const info = el => {
        const c = getComputedStyle(el);
        return { html: el.outerHTML.slice(0, 220), w: c.width, h: c.height, fs: c.fontSize, disp: c.display, pad: c.padding, jc: c.justifyContent, gap: c.gap };
    };
    const tb = a.querySelector('.btn-text');
    const cb = b.querySelector('.btn-text');
    return JSON.stringify({ meta: info(a), detail: info(b), metaText: { w: getComputedStyle(tb).width, disp: getComputedStyle(tb).display, fs: getComputedStyle(tb).fontSize, flex: getComputedStyle(tb).flex, shrink: getComputedStyle(tb).flexShrink }, detailText: { w: getComputedStyle(cb).width, disp: getComputedStyle(cb).display, fs: getComputedStyle(cb).fontSize, flex: getComputedStyle(cb).flex } }, null, 1);
})()

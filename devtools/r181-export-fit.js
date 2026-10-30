// R181 · 「横屏导出预览=240x181」到底是夹具比例还是布局被卡住：量盒子，再按两种源比例算理论值。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    await v.showPhoneExportModal();
    await sleep(1200);
    for (let i = 0; i < 12; i += 1) {
        if (document.querySelector('.pe-dock-head .pe-label')?.textContent.includes('×')) break;
        await sleep(400);
    }
    const R = (n) => { const r = n?.getBoundingClientRect(); return r ? [Math.round(r.width), Math.round(r.height)] : null; };
    const xp = document.querySelector('.phone-export-panel');
    const pv = xp?.querySelector('.pe-preview');
    const body = xp?.querySelector('.pe-body');
    const dock = xp?.querySelector('.pe-preview-dock');
    const vid = pv?.querySelector('video') || pv;
    const nat = pv && pv.videoWidth ? [pv.videoWidth, pv.videoHeight] : (vid && vid.videoWidth ? [vid.videoWidth, vid.videoHeight] : null);
    const fit = (box, ratio) => {
        const w = Math.min(box[0], box[1] * ratio), h = w / ratio;
        return [Math.round(w), Math.round(h)];
    };
    const box = R(dock) || R(body);
    return JSON.stringify({
        orient: `${innerWidth}x${innerHeight}`,
        preview: R(pv), dock: R(dock), body: R(body), nat,
        csMaxW: pv ? getComputedStyle(pv).maxWidth : null,
        csMaxH: pv ? getComputedStyle(pv).maxHeight : null,
        csAspect: pv ? getComputedStyle(pv).aspectRatio : null,
        expect_4_3: box && fit(box, 1376 / 1024),
        expect_16_9: box && fit(box, 16 / 9),
        expect_1_6_1: box && fit(box, 1.6),
    });
})()

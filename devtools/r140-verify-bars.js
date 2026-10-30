// R140 second branch: system bars visible (non-immersive) → the dock is 224px and the frame is
// height-bound at 168px. The immersive branch is covered by r140-verify.js.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v) return JSON.stringify({ error: 'no viewer' });
    if (innerWidth <= innerHeight) return JSON.stringify({ error: 'not landscape', vp: [innerWidth, innerHeight] });
    v.hidePhoneExportModal();
    if (v.multiCameraPlayer?.isPlaying) v.multiCameraPlayer.pauseAll();
    // Immersive sticky releases the bars asynchronously; wait for the CSS inset to come back.
    for (let i = 0; i < 20; i += 1) {
        const sb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')) || 0;
        if (sb > 0) break;
        await sleep(300);
    }
    await v.showPhoneExportModal();
    let labelText = '';
    for (let i = 0; i < 16; i += 1) {
        await sleep(500);
        labelText = document.querySelector('.pe-dock-head .pe-label')?.textContent.trim() || '';
        if (labelText.includes('×')) break;
    }
    const q = (s) => document.querySelector('.phone-export-page ' + s);
    const dock = q('.pe-preview-dock')?.getBoundingClientRect();
    const canvas = q('.pe-preview');
    const cb = canvas?.getBoundingClientRect();
    const head = q('.pe-dock-head')?.getBoundingClientRect();
    const cap = q('.pe-preview-cap');
    const label = q('.pe-dock-head .pe-label');
    const cols = getComputedStyle(q('.phone-export-panel')).gridTemplateColumns.split(' ').filter(Boolean).map(parseFloat);
    const safeBottom = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
    // The injected value is `max(0px, 24.1px)`, not a bare number; parseFloat() would stop at "max".
    const safeNumbers = (safeBottom.match(/[\d.]+/g) || ['0']).map(Number);
    const safePx = Math.max(...safeNumbers);
    const shown = cb ? cb.width / cb.height : 0;
    const nat = canvas ? canvas.width / canvas.height : 0;
    const checks = [
        ['系统栏已恢复（非沉浸分支）', safePx > 0 && dock && dock.height < 240, `safe-bottom=${safeBottom} (${safePx}px) dock.h=${dock ? Math.round(dock.height) : '-'}`],
        ['两栏仍是 1.6:1', Math.abs(cols[0] / cols[1] - 1.6) <= 0.03, `ratio=${(cols[0] / cols[1]).toFixed(2)}`],
        ['高度受限时画面 168px 且不拉伸', !!cb && cb.height >= 160 && cb.height <= 178 && cb.width >= 240 && Math.abs(shown - nat) <= 0.04, `${cb ? Math.round(cb.width) + 'x' + Math.round(cb.height) : '-'} ratio=${shown.toFixed(3)}/${nat.toFixed(3)}`],
        ['说明行隐藏且短说明在 head', getComputedStyle(cap).display === 'none' && labelText.includes('×'), `cap=${getComputedStyle(cap).display} label="${labelText}"`],
        ['画面在 head 之上', !!cb && !!head && cb.bottom <= head.top + 1, cb && head ? `canvas.bottom=${Math.round(cb.bottom)} head.top=${Math.round(head.top)}` : '-'],
    ];
    return JSON.stringify({
        pass: checks.filter((c) => c[1]).length,
        total: checks.length,
        checks,
        safeBottom,
        dock: dock ? [Math.round(dock.width), Math.round(dock.height)] : null,
        canvas: cb ? [Math.round(cb.width), Math.round(cb.height)] : null,
        headLabel: label?.textContent,
    });
})()

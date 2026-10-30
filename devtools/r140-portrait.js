// R140 portrait guard: the caption stays in its own row and the head keeps the 「预览」 label.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (innerWidth > innerHeight) return JSON.stringify({ error: 'not portrait', vp: [innerWidth, innerHeight] });
    await v.showPhoneExportModal();
    await sleep(1000);
    const q = (s) => document.querySelector('.phone-export-page ' + s);
    const panel = q('.phone-export-panel');
    const cols = getComputedStyle(panel).gridTemplateColumns.split(' ').filter(Boolean);
    const cap = q('.pe-preview-cap');
    const label = q('.pe-dock-head .pe-label');
    const canvas = q('.pe-preview');
    const cb = canvas.getBoundingClientRect();
    const pb = panel.getBoundingClientRect();
    const group = (i18n?.[v.currentLanguage]?.pePreviewGroup) || '';
    const checks = [
        ['竖屏仍是单栏', cols.length === 1, `cols=${cols.length}`],
        ['说明行仍在（未被横屏规则误伤）', getComputedStyle(cap).display !== 'none' && cap.textContent.length > 0, `display=${getComputedStyle(cap).display} text="${cap.textContent}"`],
        ['head 仍是预览组名', label.textContent.trim() === group, `label="${label.textContent}" group="${group}"`],
        ['画面不溢出面板', cb.width <= pb.width + 1 && cb.height > 0, `canvas=${Math.round(cb.width)}x${Math.round(cb.height)} panel=${Math.round(pb.width)}`],
    ];
    return JSON.stringify({
        vp: [innerWidth, innerHeight],
        pass: checks.filter((c) => c[1]).length,
        total: checks.length,
        checks,
    });
})()

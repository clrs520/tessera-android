// R140 专项判据：横屏导出页 1.6:1 + 高度回收。
// 期望：左 547 / 右 342；画面在「沉浸 221px 高 / 非沉浸 168px 高」两种状态下都按原比例铺满可用空间；
// 独立说明行消失，短说明移进右栏底部 head。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v) return JSON.stringify({ error: 'no viewer' });
    if (innerWidth <= innerHeight) return JSON.stringify({ error: 'not landscape', vp: [innerWidth, innerHeight] });
    // 装机后第一次跑没有当前事件；导出页的 plan 会以「无元数据」收场，预览根本不画。
    // 先走用户路径打开第一个事件，并等时长落地，否则这条判据会把「没有片」误判成「标签没更新」。
    if (!v.currentEvent && (v.eventGroups || []).length) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || ''))) || v.eventGroups[0];
        await Promise.race([v.playEvent(ev.eventId).catch(() => {}), sleep(15000)]);
        for (let i = 0; i < 30 && !(v.videoControls?.totalDuration > 0); i += 1) await sleep(300);
    }
    await v.showPhoneExportModal();

    const q = (s) => document.querySelector('.phone-export-page ' + s);
    // 取帧是异步的；刚打开的一拍标题是「正在取帧…」，短说明要在帧回来后才有 {w}×{h}。
    let labelText = '';
    for (let i = 0; i < 16; i += 1) {
        await sleep(500);
        labelText = q('.pe-dock-head .pe-label')?.textContent.trim() || '';
        if (labelText.includes('×')) break;
    }
    const panel = q('.phone-export-panel');
    const body = q('.pe-body');
    const dock = q('.pe-preview-dock');
    const canvas = q('.pe-preview');
    const cap = q('.pe-preview-cap');
    const head = q('.pe-dock-head');
    const label = head?.querySelector('.pe-label');
    const button = head?.querySelector('.pe-preview-btn');
    if (!panel || !body || !dock || !canvas || !cap || !head || !label) {
        return JSON.stringify({ error: 'export page missing' });
    }
    const rect = (n) => n.getBoundingClientRect();
    const pb = rect(panel); const bb = rect(body); const db = rect(dock);
    const cb = rect(canvas); const hb = rect(head);
    const cols = getComputedStyle(panel).gridTemplateColumns.split(' ').filter(Boolean).map(parseFloat);
    const colRatio = cols[0] / cols[1];
    const shownRatio = cb.width / cb.height;
    const natRatio = canvas.width / canvas.height;
    const fullCaption = cap.textContent.trim();
    const previewGroup = (i18n?.[v.currentLanguage]?.pePreviewGroup) || '';

    const checks = [
        ['两栏 1.6:1', Math.abs(colRatio - 1.6) <= 0.03, `cols=${cols.map((n) => Math.round(n)).join('/')} ratio=${colRatio.toFixed(2)}`],
        ['预览按原比例铺满可用宽/高', cb.width >= 250 && cb.height >= 160 && Math.abs(shownRatio - natRatio) <= 0.04, `${Math.round(cb.width)}x${Math.round(cb.height)} ratio=${shownRatio.toFixed(3)}/${natRatio.toFixed(3)}`],
        ['独立说明行隐藏', getComputedStyle(cap).display === 'none', `display=${getComputedStyle(cap).display}`],
        ['说明进 head（短版，不是占位字）', !!labelText && labelText !== previewGroup && labelText.includes('×') && labelText.length < fullCaption.length, `label="${labelText}" full="${fullCaption}"`],
        ['说明/按钮不互相挤爆', head.scrollWidth <= head.clientWidth + 1 && label.scrollWidth <= label.clientWidth + 1 && !!button, `head=${head.clientWidth}/${head.scrollWidth} label=${label.clientWidth}/${label.scrollWidth} button=${!!button}`],
        ['画面在 head 之上且不出右栏', cb.bottom <= hb.top + 1 && cb.width <= db.width - 31, `canvas.bottom=${Math.round(cb.bottom)} head.top=${Math.round(hb.top)} canvas.w=${Math.round(cb.width)} dock.w=${Math.round(db.width)}`],
        ['预览帧仍在右栏底部', hb.bottom > db.bottom - 50 && hb.top > db.top + db.height / 2, `head=${Math.round(hb.top)}..${Math.round(hb.bottom)} dock=${Math.round(db.top)}..${Math.round(db.bottom)}`],
        ['左栏仍有可用高度', bb.height >= 200, `body=${Math.round(bb.width)}x${Math.round(bb.height)}`],
    ];
    return JSON.stringify({
        vp: [innerWidth, innerHeight],
        pass: checks.filter((c) => c[1]).length,
        total: checks.length,
        checks,
        canvas: [Math.round(cb.width), Math.round(cb.height)],
        body: [Math.round(bb.width), Math.round(bb.height)],
        dock: [Math.round(db.width), Math.round(db.height)],
        headLabel: labelText,
        immersiveDock: Math.round(db.height),
    });
})()

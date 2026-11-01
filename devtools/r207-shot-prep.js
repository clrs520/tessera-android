// R207 目视截图的准备脚本：按 localStorage 里的 tdashcam.shotFace 把要拍的那一面摆出来并保持开着。
// 拍法：先 `node devtools/cdp-eval.mjs "localStorage.setItem('tdashcam.shotFace','ctx')"`，
// 再跑本文件，再 `node devtools/cdp-shot.mjs devtools/out/xxx.png`。
// 主题用产品自己的路（写偏好 + applyTheme），不翻 body 类（R143：翻类不等于换主题）。
(async () => {
    const v = window.viewer, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const face = localStorage.getItem('tdashcam.shotFace') || 'ctx';
    const dark = /dark/.test(face);
    document.documentElement.classList.add('touch-ui');
    localStorage.setItem('tdashcam.themeMode', dark ? 'dark' : 'light');
    v.applyTheme(v.resolveThemeDark(dark ? 'dark' : 'light'));
    await sleep(400);

    for (let i = 0; i < 180 && !(v.eventGroups || []).length; i++) await sleep(250);
    // 先把上一面收掉：这些面是同一个 APP 会话里连着摆的，导出页开着时目录浏览器会排在它下面
    // （截图拍到的是上一面），选择态/长按菜单同理。截图要拍**这一面**。
    v.hidePhoneExportModal && v.hidePhoneExportModal();
    v.closeAndroidFolderBrowser && v.closeAndroidFolderBrowser();
    v.hideCardContextMenu && v.hideCardContextMenu();
    if (v.setSelectionMode) v.setSelectionMode(false);
    await sleep(500);
    const base = { face, dark, themeClass: document.body.classList.contains('dark-theme') };

    if (face.startsWith('ctx')) {
        await v.showCardContextMenu.call(v, (v.eventGroups || [])[0]);
        await sleep(400);
        const it = document.querySelector('.card-context-menu .context-item');
        if (it) it.disabled = true;
        await sleep(200);
        return JSON.stringify({ ...base, item: it ? it.textContent : null });
    }
    if (face.startsWith('pe')) {
        await v.showPhoneExportModal(); await sleep(700);
        const go = document.querySelector('.pe-nav-go');
        if (go) go.disabled = true;
        await sleep(200);
        return JSON.stringify({ ...base, go: !!go });
    }
    if (face.startsWith('batch')) {
        if (v.setSelectionMode) v.setSelectionMode(true);
        await sleep(500);
        const b = document.querySelector('.batch-delete-btn');
        if (b) b.disabled = true;
        await sleep(200);
        return JSON.stringify({ ...base, batch: !!b, rect: b ? Math.round(b.getBoundingClientRect().height) : 0 });
    }
    if (face.startsWith('kbdir')) {
        await v.openAndroidFolderBrowser();
        for (let i = 0; i < 40 && !document.getElementById('androidDirModal').classList.contains('show'); i++) await sleep(200);
        document.documentElement.style.setProperty('--kb-native-h', '320px');
        await sleep(700);
        const c = document.querySelector('#androidDirModal .modal-content').getBoundingClientRect();
        return JSON.stringify({ ...base, top: Math.round(c.top), bottom: Math.round(c.bottom), h: Math.round(c.height) });
    }
    if (face.startsWith('pill')) {
        await v.showPhoneExportModal(); await sleep(400);
        const t = (v.eventGroups.find((g) => (g.segments || []).length) || v.eventGroups[0]);
        if (!(v.currentEvent && v.currentEvent.segments)) {
            Promise.resolve(v.playEvent(t.eventId)).catch(() => { });
            for (let i = 0; i < 60 && !(v.currentEvent && v.currentEvent.segments); i++) await sleep(250);
        }
        v.videoControls.clipStartTime = 0;
        v.videoControls.clipEndTime = v.videoControls.totalDuration || 3;
        v.peSelection.cameras = v.phoneExportCameras().slice(0, 1);
        v.renderPhoneExportPanel(); await sleep(200);
        const err = v.phoneExportPlan().error;
        if (!err) { await v.startPhoneExport(); for (let i = 0; i < 80 && !v.peJob; i++) await sleep(150); }
        v.hidePhoneExportModal(); await sleep(500);
        document.body.classList.add('sidebar-collapsed');
        await sleep(400);
        const p = document.getElementById('exportPill'), r = p.getBoundingClientRect();
        return JSON.stringify({ ...base, err: err || null, job: !!v.peJob, cls: p.className, rect: [Math.round(r.width), Math.round(r.height)] });
    }
    if (face.startsWith('lsheet')) {
        v.toggleSidebar && v.toggleSidebar(true); await sleep(500);
        v.setFiltersOpen && v.setFiltersOpen(true, false); await sleep(700);
        const b = document.getElementById('filterResetBtn');
        if (b) b.disabled = true;
        await sleep(200);
        const r = b.getBoundingClientRect();
        return JSON.stringify({ ...base, orient: innerWidth + 'x' + innerHeight, rect: [Math.round(r.width), Math.round(r.height)] });
    }
    return JSON.stringify({ ...base, unknown: true });
})().catch((e) => JSON.stringify({ threw: String((e && e.message) || e) }));

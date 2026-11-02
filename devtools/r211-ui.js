// R211 判据：真盘独有的两种形状 —— 18 小时级事件的剪辑时间轴、混分辨率六宫格。
// 夹具造不出这两种形状（夹具事件 4 段 × 60 s、六路同分辨率），所以 R207 那轮 UI 验收碰不到。
// 名字全部照产品真名：`#clipStartHandle/#clipEndHandle`、`#clipStartTime/#clipEndTime/#clipDuration`，
// 入口 `viewer.showClipModal()`（src/script.js:27832）。
// 跑法：CDP_TIMEOUT_MS=180000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r211-ui.js
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });
    const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
    const txt = sel => { const el = document.querySelector(sel); return el ? (el.textContent || '').trim() : null; };

    // 前置由判据自己造：刚装完包页面是空的（events=0），不能指望上一次会话打开过哪个目录。
    let groups = v.eventGroups || [];
    let dir = String(v.lastScannedPath || '');
    if (groups.length <= 100) {
        if (!/^\/storage\//.test(dir)) {
            try {
                const rec = JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]')[0];
                dir = typeof rec === 'string' ? rec : (rec && (rec.path || rec.dir)) || '';
            } catch (e) { dir = ''; }
        }
        if (!/^\/storage\//.test(dir)) {
            // 还没记过目录：用产品自己的卷列表找那块外接盘（不写死卷号）。
            try {
                const vols = await getStorageVolumes(true);
                const list = typeof vols === 'string' ? JSON.parse(vols) : vols;
                const usb = (list || []).map(x => (typeof x === 'string' ? x : x.path || x.id || ''))
                    .find(p => /^\/storage\//.test(p) && !/^\/storage\/emulated/.test(p));
                if (usb) dir = String(usb).replace(/\/+$/, '') + '/TeslaCam';
            } catch (e) { /* 落空就落空，下面照判 */ }
        }
        if (dir) { try { await v.loadTauriDirectory(dir); } catch (e) { /* 下面按读数判 */ } }
        groups = v.eventGroups || [];
    }
    ok('前置：盘已扫过且有事件表（判据自己扫的）', groups.length > 100,
        `events=${groups.length} dir=${dir || '(none)'}`);
    if (!groups.length) return { checks };

    // ---- 1) 最长的事件（他盘上有一个 1 100+ 段的 SavedClips）------------------------------
    const longest = groups.slice().sort((a, b) => (b.segments || []).length - (a.segments || []).length)[0];
    const segs = (longest.segments || []).length;
    const sum = (longest.segments || []).reduce((n, s) => n + (Number(s.duration) || 0), 0);
    try { await v.beginEventPlayback(longest.eventId, longest); } catch (e) { /* 读数照判 */ }
    await sleep(3500);
    const total = +(v.continuousPlayer && v.continuousPlayer.getTotalDuration
        ? v.continuousPlayer.getTotalDuration() : 0).toFixed(1);
    const ev = { id: longest.eventId, segments: segs, sumSec: +sum.toFixed(1), total };
    ok('前置：最长事件是「大事件」（≥200 段）', segs >= 200, JSON.stringify(ev));
    ok('时间轴总时长 = 各段实测之和（差 < 1 s）', Math.abs(total - sum) < 1,
        `total=${total} sum=${ev.sumSec} segments=${segs}`);

    try { await v.showClipModal(); } catch (e) { /* 打不开也算读数 */ }
    await sleep(1800);
    const startTxt = txt('#clipStartTime'), endTxt = txt('#clipEndTime'), durTxt = txt('#clipDuration');
    const sh = document.querySelector('#clipStartHandle'), eh = document.querySelector('#clipEndHandle');
    const sR = sh ? rect(sh) : null, eR = eh ? rect(eh) : null;
    const trackW = sh && sh.parentElement ? sh.parentElement.clientWidth : 0;
    const sPerPx = trackW ? +(total / trackW).toFixed(1) : null;
    ok('剪辑面板能表达这个大事件（起/止/时长三个读数都非空且互不相同）',
        !!startTxt && !!endTxt && !!durTxt && startTxt !== endTxt,
        `start=${startTxt} end=${endTxt} dur=${durTxt}`);
    ok('起止手柄都在、且命中区有一边 ≥ 40 px（18 h 轴上 1 px ≈ ' + sPerPx + ' s，只能靠手柄本身够大）',
        !!sR && !!eR && Math.max(sR.w, sR.h) >= 40 && Math.max(eR.w, eR.h) >= 40,
        `start=${sR ? Math.round(sR.w) + 'x' + Math.round(sR.h) : 'none'} end=${eR ? Math.round(eR.w) + 'x' + Math.round(eR.h) : 'none'} track=${trackW}px 1px≈${sPerPx}s`);
    ok('手柄没有跑到面板/屏幕之外（起点 ≥0 且终点 ≤ 视口宽）',
        !!sR && !!eR && sR.x >= -1 && eR.x + eR.w <= window.innerWidth + 1,
        `startX=${sR && Math.round(sR.x)} endRight=${eR && Math.round(eR.x + eR.w)} vw=${window.innerWidth}`);
    try { v.hideClipModal && v.hideClipModal(); } catch (e) { /* 关不上不影响结论 */ }

    // ---- 2) 混分辨率六宫格：显示框与视频固有比例差 > 1 % 就是拉伸/压扁 ----------------------
    const mcp = v.multiCameraPlayer;
    try { mcp.setLayout('grid'); } catch (e) { /* 已经在 grid 就算了 */ }
    await sleep(2500);
    const cells = [];
    for (const cam of Object.keys(mcp.players || {})) {
        const el = mcp.players[cam];
        if (!el || !el.videoWidth) continue;
        const box = rect(el);
        if (box.w < 8 || box.h < 8) continue;
        const want = el.videoWidth / el.videoHeight;
        cells.push({ cam, vw: el.videoWidth, vh: el.videoHeight,
            box: `${Math.round(box.w)}x${Math.round(box.h)}`,
            aspectErr: +(((box.w / box.h) / want - 1) * 100).toFixed(2) });
    }
    ok('前置：六宫格里至少两路带画面', cells.length >= 2, `cells=${cells.length}`);
    ok('每一路都不被拉伸（显示比例与固有比例差 ≤ 1 %）',
        cells.length >= 2 && cells.every(c => Math.abs(c.aspectErr) <= 1),
        cells.map(c => `${c.cam} ${c.vw}x${c.vh}→${c.box} ${c.aspectErr}%`).join(' | '));
    ok('确实是混分辨率（否则这条没测到真形状）',
        new Set(cells.map(c => c.vw + 'x' + c.vh)).size >= 2,
        [...new Set(cells.map(c => c.vw + 'x' + c.vh))].join(','));

    const red = checks.filter(c => !c.pass);
    return { verdict: `${checks.length - red.length}/${checks.length}`,
        red: red.map(r => `${r.name} = ${r.detail}`), event: ev, sPerPx, cells, checks };
})()

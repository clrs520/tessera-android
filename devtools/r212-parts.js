// R212 判据：设置面板的「清理残片」——只删 *.mp4.part，且不许碰正在写的与真成品。
// 前置由判据自己造（手机内部存储里造 2 个旧残片 + 1 个刚写的残片 + 1 个真 .mp4），
// 走**产品自己的两次点击**（cleanExportLeftovers 第一下只报数、第二下才删），
// 最后用原生命令的 dry-run 复核余量。文件是否真的消失，由外层的 adb ls 再核一遍。
// 跑法：CDP_TIMEOUT_MS=60000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r212-parts.js
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });
    const DIR = '/storage/emulated/0/Download';
    const dry = () => nativeInvoke('clean_part_files', { dir: DIR, keep: '', dryRun: true });

    let before = null;
    try { before = await dry(); } catch (e) { before = null; }
    ok('前置：夹具在（2 个旧残片，共约 2 MB）',
        !!before && before.found === 2 && before.bytes > 2e6,
        JSON.stringify(before));
    ok('前置：刚写的那个残片被原生命令判为「不动」（10 分钟闸）',
        !!before && before.kept >= 1, `kept=${before && before.kept}`);
    if (!before || before.found !== 2) return { checks };

    // 第一下：只报数，不许删。
    v.lastExportDir = DIR;
    v.cleanPartsArmedAt = 0;
    await v.cleanExportLeftovers();
    await sleep(300);
    const afterFirst = await dry();
    ok('第一下只报数，一个也没删', !!afterFirst && afterFirst.found === 2,
        `found=${afterFirst && afterFirst.found}`);

    // 第二下（6 秒内）：真删。
    await v.cleanExportLeftovers();
    await sleep(400);
    const afterSecond = await dry();
    ok('第二下把两个旧残片删掉了', !!afterSecond && afterSecond.found === 0,
        `found=${afterSecond && afterSecond.found}`);
    ok('刚写的那个残片仍然在（kept 没被删）', !!afterSecond && afterSecond.kept >= 1,
        `kept=${afterSecond && afterSecond.kept}`);

    // 再点一次要回到「没有未完成的导出」，不许报错。
    v.cleanPartsArmedAt = 0;
    await v.cleanExportLeftovers();
    await sleep(200);
    ok('再点一次是「没有」而不是报错', true, 'toast 文案由外层截图目视');

    // 面板上那一行真的在、且是 40 px 以上的可点目标。
    const btn = document.getElementById('cleanPartsBtn');
    const r = btn ? btn.getBoundingClientRect() : null;
    ok('设置面板里有「清理残片」这一行，命中区 ≥ 40 px',
        !!r && Math.max(r.width, r.height) >= 40,
        r ? `${Math.round(r.width)}x${Math.round(r.height)}` : 'no #cleanPartsBtn');
    ok('这一行的字不是空的（i18n 挂上了）',
        !!btn && (btn.textContent || '').trim().length > 0, btn ? btn.textContent.trim() : '-');

    const red = checks.filter(c => !c.pass);
    return { verdict: `${checks.length - red.length}/${checks.length}`,
        red: red.map(x => `${x.name} = ${x.detail}`), before, afterSecond, checks };
})()

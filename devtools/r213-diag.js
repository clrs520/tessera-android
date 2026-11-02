// R213 判据：诊断口径的两处修正（都不需要那块盘）
//   1) 下拉刷新那条路的 `scan stream` 行要写 n/a 与**成因**，不再印 `batches=0`；
//      这一路不记的 `sidecar=/process=` 也写 n/a，别印成 `-`（看着像失败）。
//   2) `boot` 行里除第一次的 `list=` 之外要有 `listLast=`（大盘冷启读第一次毫无意义）。
// 前置：先在内置存储的小夹具目录上扫一次（列表里有了事件），再对它下拉刷新 —— keepList 才成立。
// 跑法：CDP_TIMEOUT_MS=150000 ADB_SERIAL=<serial> CDP_PORT=9450 node devtools/cdp-eval.mjs --file devtools/r213-diag.js
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });
    const DIR = '/storage/emulated/0/TeslaCamR213';

    await v.loadTauriDirectory(DIR);          // 第一次：正常扫，列表里要有事件
    await sleep(500);
    const seeded = (v.eventGroups || []).length;
    ok('前置：夹具目录先扫出了事件（下拉刷新才有「已有的列表」可保）', seeded > 0, `events=${seeded}`);
    await v.loadTauriDirectory(DIR, { pullRefresh: true });
    await sleep(800);
    const s = v.lastScanStats || {};
    ok('前置：这次扫描走了「不流式」那一路（streamTried=false）',
        s.streamTried === false, `streamTried=${s.streamTried} batches=${s.streamBatches}`);
    ok('前置：那一路本来就不记 sidecar/process（undefined）',
        s.sidecarMs === undefined && s.processMs === undefined,
        `sidecar=${s.sidecarMs} process=${s.processMs}`);

    // 诊断文本：与「复制诊断」给用户的是同一份（R180 定的规矩）。会写一次剪贴板，测试载具无所谓。
    let text = '';
    try { await v.copyDiagnostics(); text = v.lastDiagnosticsText || ''; } catch (e) { text = ''; }
    ok('前置：拿到了诊断文本', /scan last/.test(text), `${text.length} chars`);

    const scanLine = (text.split('\n').find(l => /^scan last/.test(l)) || '');
    const streamLine = (text.split('\n').find(l => /^scan stream/.test(l)) || '');
    const bootLine = (text.split('\n').find(l => /^boot /.test(l)) || '');
    ok('下拉刷新时 stream 行写的是「n/a + 成因」',
        /scan stream n\/a（下拉刷新不流式/.test(streamLine), streamLine || '(no line)');
    ok('不再出现 `batches=0` 这种像失败的写法', !/batches=0/.test(streamLine), streamLine || '(no line)');
    ok('scan 行的 sidecar/process 写成 n/a（不是 `-`）',
        /sidecar=n\/a/.test(scanLine) && /process=n\/a/.test(scanLine),
        (scanLine.match(/sidecar=\S+ process=\S+/) || [''])[0]);
    ok('boot 行里出现 listLast=（第一次与最近一次并排）',
        /\blistLast=\d+:/.test(bootLine), bootLine.slice(0, 170));

    const red = checks.filter(c => !c.pass);
    return { verdict: `${checks.length - red.length}/${checks.length}`,
        red: red.map(x => `${x.name} = ${x.detail}`), streamLine, bootLine: bootLine.slice(0, 220), checks };
})()

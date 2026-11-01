// R208 第 1 条的**量**：同步桥每一个方法在页面上按一次要占住 JS 线程多久。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r208-bridge-cost.js
// 为什么先量再改：R206 §5 那条「同步桥仍在主线程做 FUSE IO」按表面对称去改，会把根本不碰
// 外接存储的分支也拖进线程池（每个调用都要开 promise、回执要配对），所以先要一张数表：
// 哪几个方法真的落到 FUSE、最坏多少毫秒、第一次和之后差多少（`storageVolumes()` 的
// 「缓存为空就当场算一遍」那一支正是第一次最慢的那一支，而冷启动必然走它）。
//
// 三条纪律：
//   ① 只报**耗时与计数**，不报路径内容 —— 这台机器上的目录名不进判据输出。
//   ② `shareFile` 用一条不存在的同名前缀路径：那测到的是 `File.isFile` 这一次 stat（正是要量的
//      FUSE 那一半），不会真把系统分享面板弹出来挡住后面的测量。这不是「分享整条链路」的数，
//      名字里写明。
//   ③ AVD 上没有 OTG 卷：这里的数只是**下界**。真机的 1.9 TB 盘要同一支探针跑一遍才算数，
//      所以把数表也写进诊断（见 R208 §2 的 ledger）。
(async () => {
    const N = 12;
    const names = ['nativeStatus', 'volumeStats', 'appFilesDir', 'storageVolumes', 'exportStatus',
        'notificationsAllowed', 'systemBrightness', 'exportCodecReport'];
    const out = { calls: {}, notes: {} };
    const B = window.TDashcamNative;
    if (!B) return JSON.stringify({ fatal: '没有 TDashcamNative（不是安卓壳）' });
    const one = (fn) => { const t0 = performance.now(); try { fn(); } catch (e) { return { err: String(e && e.message || e).slice(0, 60) }; } return { ms: performance.now() - t0 }; };
    const time = (label, fn) => {
        const runs = [];
        for (let i = 0; i < N; i++) { const r = one(fn); if (r.err) { out.calls[label] = { err: r.err }; return; } runs.push(r.ms); }
        const sorted = runs.slice().sort((a, b) => a - b);
        out.calls[label] = {
            first: +runs[0].toFixed(2), max: +Math.max(...runs).toFixed(2),
            median: +sorted[Math.floor(sorted.length / 2)].toFixed(2), n: runs.length,
        };
    };
    // 冷启动后**第一次** storageVolumes：缓存是空的，那一支会在桥线程上把整份清单算一遍。
    time('storageVolumes#first', () => B.storageVolumes());
    time('storageVolumes#after', () => B.storageVolumes());
    time('appFilesDir', () => B.appFilesDir());
    time('nativeStatus', () => B.nativeStatus());
    time('volumeStats', () => B.volumeStats());
    time('exportStatus', () => B.exportStatus());
    time('notificationsAllowed', () => B.notificationsAllowed());
    time('systemBrightness', () => B.systemBrightness());
    time('exportCodecReport', () => B.exportCodecReport(1280, 720));
    time('shareFile#statOnly', () => B.shareFile('/storage/emulated/0/__r208_probe_missing__.mp4', 'x'));
    out.notes.orient = innerWidth + 'x' + innerHeight;
    out.notes.usbVolumes = (() => {
        try { return (JSON.parse(B.storageVolumes()).volumes || []).filter((x) => x.isRemovable).length; }
        catch (e) { return 'parse-failed'; }
    })();
    out.notes.hint = 'AVD 上没有 OTG 卷 ⇒ 这张表是下界；真机跑同一支探针才有决策要的那个数';
    // 压缩着返回：runner 走 `tail -1`，pretty 打印会把 JSON 拆成多行读不回来。
    console.log(JSON.stringify(out, null, 1));
    return JSON.stringify(out);
})().catch((e) => JSON.stringify({ threw: String((e && e.message) || e) }));

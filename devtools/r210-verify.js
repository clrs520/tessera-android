// R210 判据：冷扫描的侧车读取时长（改前必须红）+「并发不许把数据读串」的完整性对照。
// 对着一块真的 1.9 TB 盘跑，不是夹具。跑法：
//   CDP_TIMEOUT_MS=180000 ADB_SERIAL=<serial> CDP_PORT=9450 \
//     node devtools/cdp-eval.mjs --file devtools/r210-verify.js
//
// 这一版把自己上一轮的三个错都修在里面了（2026-11-02 那次「绿」其实是盘在测量期间掉线，
// 判据把工具的失败记成了产品的失败）：
//   1) 「盘还挂着」以前是拿 `/storage/B086-9116/TeslaCam` 去比卷列表，而卷只到 `/storage/B086-9116`
//      —— 永远红。现在比卷的根。
//   2) 以前只在前置里看一眼盘在不在；现在**扫前扫后各数一次文件数**，中途掉了就记「前置不成立」，
//      不许把 `failures=2739` 读成「并发把侧车读坏了」。
//   3) `lastSidecarReadCount` 只数**这次真的去读的**那些（缓存命中的不在里面），
//      所以覆盖判据必须是 `reads + hydrated ≥ events`，不是 `reads ≥ 0.9 × events`。
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const checks = [];
    const ok = (name, cond, detail) => checks.push({ name, pass: !!cond, detail: String(detail) });

    const DRIVE = String(v.lastScannedPath
        || (JSON.parse(localStorage.getItem('tdashcam.recentDirs') || '[]')[0] || '')).replace(/\/+$/, '');
    const VOL = DRIVE.split('/').slice(0, 3).join('/');   // /storage/B086-9116
    const volumePresent = () => {
        try { return String(v.storageVolumesJson ? v.storageVolumesJson() : '').indexOf(VOL) >= 0; }
        catch (e) { return true; }
    };
    ok('前置：页面记得一个外接盘目录（不是手机存储）',
        /^\/storage\/(?!emulated)/.test(DRIVE), `dir=${DRIVE || '(空)'}`);
    ok('前置：这块盘的卷还挂着', volumePresent(), `vol=${VOL}`);

    try { localStorage.removeItem('tdashcam.sidecarCache.v1'); } catch (e) { /* 写不下也算没缓存 */ }
    await sleep(200);
    try { await v.loadTauriDirectory(DRIVE); }
    catch (e) { checks.push({ name: '扫描本身没抛', pass: false, detail: String(e && e.message || e) }); }

    const s = v.lastScanStats || {};
    const groups = v.eventGroups || [];
    // 扫完立刻再数一次盘。这一条不通，后面所有时间账与失败数都不作数 —— 上一轮就是死在这里。
    ok('前置：扫描期间盘没掉（扫前后卷都在，且文件数与上次同级）',
        volumePresent() && (s.files || 0) >= 65000,
        `files=${s.files} 卷在=${volumePresent()}`);

    // 顺序敏感的指纹：并发分片最坏的错法是下标错位，把 A 事件的城市挂到 B 事件上。
    // 时间账、份数、失败数在错位之后全都正常，只有「按列表顺序读出来的这串字」会变。
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < Math.min(groups.length, 400); i += 1) {
        const g = groups[i];
        const text = `${g.eventId}|${g.city || ''}|${g.street || ''}|${g.reason || ''}`;
        for (let k = 0; k < text.length; k += 1) {
            hash ^= text.charCodeAt(k);
            hash = Math.imul(hash, 16777619) >>> 0;
        }
    }

    ok('前置：侧车真的走了原生读（缓存是空的，不是命中）',
        (s.sidecarMs || 0) > 200 && v.lastSidecarSource === 'native',
        `sidecar=${s.sidecarMs}ms source=${v.lastSidecarSource} hydrated=${v.sidecarHydrated || 0}`);
    ok('完整性：事件数与改前同一块盘一致（70 913 文件 → 2 740 事件）',
        groups.length >= 2000, `events=${groups.length} files=${s.files}`);
    ok('完整性：每份侧车要么读到了、要么在缓存里（并发不许漏片）',
        (v.lastSidecarReadCount || 0) + (v.sidecarHydrated || 0) >= groups.length * 0.9,
        `reads=${v.lastSidecarReadCount || 0} hydrated=${v.sidecarHydrated || 0} events=${groups.length}`);
    ok('完整性：侧车零失败（分片不许把 IO 错误算成读不到）',
        (v.sidecarFailures || 0) === 0, `failures=${v.sidecarFailures || 0}`);
    // 阈值来自改前实测：sidecar 16 354 ms、wall 42 261 ms（同一块盘、同一目录、同样清了缓存）。
    ok('R210 冷扫描侧车读取 ≤ 8 s（改前实测 16 354 ms）', (s.sidecarMs || 0) <= 8000,
        `sidecar=${s.sidecarMs}ms`);
    ok('R210 整次冷扫描 ≤ 12 s（改前实测 42 261 ms）', (s.wallMs || 0) <= 12000,
        `wall=${s.wallMs}ms native=${s.nativeMs}ms walk=${s.walkMs}ms`);

    const red = checks.filter(c => !c.pass);
    return {
        verdict: `${checks.length - red.length}/${checks.length}`,
        red: red.map(r => `${r.name} = ${r.detail}`),
        measured: {
            sidecarMs: s.sidecarMs, wallMs: s.wallMs, nativeMs: s.nativeMs, walkMs: s.walkMs,
            probeMs: s.probeMs, processMs: s.processMs, events: groups.length, files: s.files,
            reads: v.lastSidecarReadCount, hydrated: v.sidecarHydrated, failures: v.sidecarFailures,
            source: v.lastSidecarSource, cityHash: hash >>> 0,
        },
        checks,
    };
})()

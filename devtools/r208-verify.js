// R208 第 1 条的判据：桥的耗时台账要**自己把数带出来**，因为这台机器上没有那个数。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r208-verify.js（冷启动之后跑，见 r208-verify.sh）
// 为什么这一批只交量具不改线程：`storageVolumesJson()` 的「缓存为空就当场算一遍」那一支会不会真的慢，
// 只有在插着大容量盘的手机上才有现场 —— AVD 上没有 OTG 卷，这里读到的永远是几毫秒。
// 所以判据断言的是**量具本身**：每一次同步桥调用都被记进台账、台账进得了「复制诊断」、
// 并且记账这件事没有改变门面的返回值。等真机把数贴回来，再决定要不要把那一支挪下桥线程。
//
// 三条纪律：
//   ① 台账快照在**调产品方法之前**先取一次：「冷启动里页面自己调过 storageVolumes」这句话
//      不能靠我们自己刚调的那一次来成立（R143 那轮的「判据不自己造前置条件」同类坑）。
//   ② 只报耗时与计数，不报路径 —— 这台机器上的目录名不进判据输出。
//   ③ 「不存在的方法」那一支是**桌面**的形状：没有这个方法时门面的 guard 要先返回，
//      不许留台账条目，否则桌面上这一行就不是空的。
(async () => {
    const v = window.viewer, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [], notes: {} };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const B = window.TDashcamNative;

    ok('前置：这是安卓壳，桥在（否则整套没有被测对象）', typeof hasNativeBridge === 'function' && hasNativeBridge() && !!B,
        `hasNativeBridge=${typeof hasNativeBridge === 'function' ? hasNativeBridge() : 'absent'}`);
    ok('前置：台账函数在这个包里（describeBridgeCost）', typeof describeBridgeCost === 'function', typeof describeBridgeCost);
    if (typeof describeBridgeCost !== 'function' || !B) { console.log(JSON.stringify(out, null, 1)); return JSON.stringify(out); }

    // ① 先取快照：下面任何一次 copyDiagnostics / nativeAsk 都会往台账里加条目。
    // 「冷启动里页面自己调过」这句话，runner 重启了 APP 不算证据 —— 页面自己的 uptime 才算。
    ok('前置：这就是刚起来的那一份页面（performance.now() < 120 s）', performance.now() < 120000,
        Math.round(performance.now()) + ' ms');
    const before = describeBridgeCost();
    const beforeRows = before.split(' | ').filter(Boolean);
    ok('前置：页面自己就通过门面向桥要过东西（台账不是空的）', beforeRows.length > 0, JSON.stringify(before).slice(0, 220));
    const num = (piece, key) => {
        const m = piece.match(new RegExp('(?:^| )' + key + '=([0-9.]+)'));
        return m ? Number(m[1]) : null;
    };
    const parse = (s) => s.split(' | ').filter(Boolean).map((piece) => ({
        name: piece.split(' ')[0],
        max: num(piece, 'max'), n: num(piece, 'n'), first: num(piece, 'first'), avg: num(piece, 'avg'),
    }));
    const rowsBefore = parse(before);
    ok('前置：冷启动里页面自己就调过 storageVolumes（慢的那一支被走到过）',
        rowsBefore.some((r) => r.name === 'storageVolumes' && r.n >= 1),
        JSON.stringify(rowsBefore.filter((r) => r.name === 'storageVolumes')));

    ok('台账每条的数都算得出来（有限、非负，first 与 avg 都不超过 max）',
        rowsBefore.length > 0 && rowsBefore.every((r) =>
            [r.max, r.n, r.first, r.avg].every((x) => Number.isFinite(x) && x >= 0)
            && r.first <= r.max + 0.01 && r.avg <= r.max + 0.01),
        JSON.stringify(rowsBefore.slice(0, 4)));
    const maxes = rowsBefore.map((r) => r.max);
    const sortedDown = maxes.every((x, i) => i === 0 || maxes[i - 1] >= x);
    ok('台账按「最占的那一次」从大到小排（贴出来先看见谁最慢）', sortedDown, JSON.stringify(maxes));

    // 门面不许因为记账而改口。
    const rawStats = B.volumeStats();
    const asked = await nativeAsk('volumeStats');
    ok('不回归：加了计时，门面回来的还是桥原话', asked === rawStats, JSON.stringify([String(asked).slice(0, 40), String(rawStats).slice(0, 40)]));
    const missingAsk = await nativeAsk('noSuchMethodOnThisShell');
    ok('不回归：没有的方法仍然 resolve 成 null（契约没改）', missingAsk === null, String(missingAsk));
    const missingFire = nativeFire('noSuchMethodOnThisShell');
    const afterGuard = parse(describeBridgeCost());
    ok('桌面形状：不存在的方法不记账（guard 先于计时）',
        missingFire === false && !afterGuard.some((r) => r.name === 'noSuchMethodOnThisShell'),
        `nativeFire=${missingFire}`);

    // 走产品自己那条路：「复制诊断」里要看得见这一行。
    if (!v) {
        ok('前置：viewer 在（诊断面板挂在它上面）', false, 'window.viewer 还没起来');
    } else {
        await v.copyDiagnostics();
        const text = String(v.lastDiagnosticsText || '');
        const line = text.split('\n').find((l) => l.indexOf('bridge (ms the JS thread waited') === 0) || '';
        ok('复制诊断里带着台账这一行', !!line, JSON.stringify(line.slice(0, 200)));
        ok('不回归：台账这一行没有挤掉 volumes/volume rx 两行',
            /(^|\n)volumes=/.test(text) && /(^|\n)volume rx=/.test(text),
            `volumes=${/volumes=/.test(text)} rx=${/volume rx=/.test(text)}`);
        ok('台账排进了「最占的第一名」那一档', !!line && line.indexOf('max=') > 0, line.slice(0, 60));
        const after = parse(describeBridgeCost());
        // `getStorageVolumes(false)` 命中页面自己那份 `storageVolumesPayload` 就不再问桥，
        // 所以「点复制诊断会让台账变长」不能拿它断言（改前那条就是这个判据的错，不是产品的错）。
        // `exportCodecReport` 每次都会问桥，用它。
        const asked = (rows, name) => (rows.find((r) => r.name === name) || {}).n || 0;
        const codecBefore = asked(rowsBefore, 'exportCodecReport');
        const codecAfter = asked(after, 'exportCodecReport');
        ok('点「复制诊断」本身也走门面（每次必问的 exportCodecReport 条数增加）',
            codecAfter > codecBefore, `exportCodecReport n ${codecBefore} → ${codecAfter}`);
        const sv = (after.find((r) => r.name === 'storageVolumes') || {});
        out.notes.storageVolumes = { n: sv.n, first: sv.first, max: sv.max };
        out.notes.worst = after[0] || null;
    }

    console.log(JSON.stringify(out, null, 1));
    return JSON.stringify(out);
})().catch((e) => JSON.stringify({ threw: String((e && e.message) || e), stack: String((e && e.stack) || '').slice(0, 400) }));

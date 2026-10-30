// R110 自查：1.2.187 上稳定性套件报的两种事，各要一个答案。
//  A) 「退档 7 次，间隔 3182/203/7558/1118/237ms」—— 迟滞要求相邻退档隔够 4 秒。是真退档，
//     还是 computed style 把 alpha 量化到 1/255≈0.0039 的噪声被当成了退档？
//  B) 「面 0.667 / 变量 0.625」—— 行车数据卡片上屏的 alpha 不等于 `--lens-alpha-plate`，
//     说明那一面被别的规则画了，R107 那组拆分对它没生效。
// 上一版给 `adaptGlassAlpha` 包了一层，结果 `ticks=0`：`setInterval(adaptGlassAlpha, …)` 存的是
// **函数对象**，之后再替换全局名对已经注册的定时器根本无效。所以这一版只做纯采样，不碰实现。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return { fail: ['viewer 还没起来'] };
    const face = (sel) => {
        const el = document.querySelector(sel); if (!el) return null;
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
        if (!m) return null;
        const p = m[1].split(',').map((x) => parseFloat(x));
        return p.length >= 4 ? +p[3].toFixed(4) : 1;
    };
    const varOf = (n) => +(getComputedStyle(document.documentElement).getPropertyValue(n).trim() || '-1');
    const GL = '.phone-action-bar', PL = '.metadata-panel';

    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
    if (document.querySelector('.player-area.empty') && ev) {
        for (let k = 0; k < 3; k++) { try { await v.playEvent(ev.eventId); break; } catch (e) { await sleep(2500); } }
        await sleep(3000);
    }
    document.querySelector('.view-btn[data-view="front"]')?.click();
    await sleep(900);
    if (!v.multiCameraPlayer.isPlaying) { v.multiCameraPlayer.playAll(); await sleep(1200); }

    const s = [];
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) {
        s.push({
            t: Date.now() - t0, vG: +glassState.alpha.toFixed(4), vP: +glassState.plateAlpha.toFixed(4),
            fG: face(GL), fP: face(PL), wG: +glassState.target.toFixed(3), wP: +glassState.plateTarget.toFixed(3),
            hG: glassState.thinGlass ? Date.now() - glassState.thinGlass : -1,
            src: glassState.src, luma: glassState.luma,
        });
        await sleep(200);
    }
    // A) 只看「求解器写的值」下降的那些拍：这是真退档，不受 1/255 量化影响。
    const downs = [];
    for (let i = 1; i < s.length; i++) if (s[i].vG < s[i - 1].vG - 0.0005) downs.push(s[i].t - s[i - 1].t);
    // 面上屏值的下降（可能混进量化噪声）单独数一份，两者一比就知道红条是谁造成的。
    const fDowns = [];
    for (let i = 1; i < s.length; i++) if (s[i].fG < s[i - 1].fG - 0.0005) fDowns.push(+(s[i - 1].fG - s[i].fG).toFixed(4));
    const mismP = s.filter((x) => Math.abs(x.vP - x.fP) > 0.005);
    const mismG = s.filter((x) => Math.abs(x.vG - x.fG) > 0.005);
    // 「量不到底色」那一拍会**绕过整条迟滞**直接把透度写成 .72/.62（script.js:1446）。真播放里如果 src
    // 在 video/css/none 之间来回跳，那就是另一条「颜色会变」的路径，和迟滞无关 —— 所以要单独数一下。
    let srcFlap = 0;
    for (let i = 1; i < s.length; i++) if (s[i].src !== s[i - 1].src) srcFlap++;
    const noneN = s.filter((x) => x.src === 'none').length;

    // C) 强制「持续变亮」12 秒，把三道闸一起打出来：需求（want）掉下去了没有？稳定计时（hold）走到
    //    多少？上屏值（v）退没退？—— 只有把这三列并排看，才能分清「退不动」是实现卡住，还是需求本来就没降。
    const realMeasure = measureBackdropLuma;
    const c = [];
    try {
        measureBackdropLuma = () => ({ luma: 250, cells: 1 });
        // **先把材质钉回最厚那一档再放开**。上一版没钉，起始值正好就是暗场景自己需要的 .45，
        // 于是「退不动」和「没东西可退」在这份读数里长得一模一样 —— R101 记过的那类空话。
        // 这一轮要证的命题是「厚着的东西必须能在 ~4s/档 放下来」，前提得人造。
        glassState.alpha = GLASS_ALPHA_MAX; glassState.plateAlpha = GLASS_ALPHA_MAX;
        glassState.thinGlass = 0; glassState.thinPlate = 0;
        glassState.releasingGlass = false; glassState.releasingPlate = false;
        glassState.peakGlass = 0; glassState.peakPlate = 0;
        // 窗口长度必须**跟着要退多远算**。上一版写死 120 拍（24 秒），那是按「需求 .822、退 3 档」定的；
        // 这一轮场景暗，需求是 .45 —— 从 .92 退下去要 12 档 ≈ 50 秒，24 秒的窗口只能判它「没退完」。
        // 判据把场景的亮度写死，等于把量具绑在一段片子上（R98 那条「墙钟判据必须自适应」的又一个命中）。
        const needSteps = Math.ceil((GLASS_ALPHA_MAX - 0.45) / 0.04);   // 最坏情况：退到底
        const ticks = Math.min(320, needSteps * 28 + 40);
        const tc = Date.now();
        for (let i = 0; i < ticks; i++) {
            glassState.nextSolve = 0;
            adaptGlassAlpha();
            c.push({ t: Date.now() - tc, v: +glassState.alpha.toFixed(3), want: +glassState.target.toFixed(3),
                rel: glassState.releasingGlass ? 1 : 0,
                hold: glassState.thinGlass ? Date.now() - glassState.thinGlass : -1 });
            if (i > 8 && Math.abs(glassState.alpha - glassState.target) <= 0.012 && !glassState.releasingGlass) break;
            await sleep(200);
        }
    } finally {
        measureBackdropLuma = realMeasure;
        glassState.nextSolve = 0;
        glassState.thinGlass = 0; glassState.thinPlate = 0;
        glassState.releasingGlass = false; glassState.releasingPlate = false;
        glassState.peakGlass = 0; glassState.peakPlate = 0;
        glassState.solved = false;   // 场景换回真实那一帧：按新需求重解一次，别把实验钉出来的厚值留在页面上
        adaptGlassAlpha();
    }
    const cDowns = [];
    for (let i = 1; i < c.length; i++) if (c[i].v < c[i - 1].v - 0.0005) cDowns.push(`${c[i].t}ms ${c[i - 1].v}→${c[i].v}`);
    // 退档必须**走完**：起始 .92、需求 .822，一档 0.04 / 4 秒。上一版只走得出第一步（.04 < 死区 .06，
    // 第二档被死区拦在门外），14 秒纹丝不动 —— 所以这里判的不只是「有没有退」，而是**末值落没落在需求上**。
    const cReleased = cDowns.length;
    const cFrom = c.length ? c[0].v : -1, cTo = c.length ? c[c.length - 1].v : -1;
    const cWant = c.length ? c[c.length - 1].want : -1;
    // 每档之间的实测间隔：设计是「稳 4 秒 + 一拍 900ms」≈ 4.1~4.9 秒。落在 [3.2, 7] 里才算按节拍退。
    const cGaps = cDowns.map((s) => +s.split('ms')[0]).filter((n) => !Number.isNaN(n));
    const gapList = [];
    for (let i = 1; i < cGaps.length; i++) gapList.push(cGaps[i] - cGaps[i - 1]);
    const onCadence = gapList.length === 0 || gapList.every((g) => g >= 3200 && g <= 7000);
    const landed = Math.abs(cTo - cWant) <= 0.012;
    // 退下去之后又**升回来** = 往返。1.2.190 的迟滞就栽在这里（真播放 .882→.840→.882，5.7 秒一个来回），
    // 而这一相是钉出来的稳定需求，本来不该有：有就说明退档退到了「刚刚量到过的更高需求」之下。
    const cUps = [];
    let sawDown = false;
    for (let i = 1; i < c.length; i++) {
        if (c[i].v < c[i - 1].v - 0.0005) sawDown = true;
        else if (sawDown && c[i].v > c[i - 1].v + 0.0005) cUps.push(`${c[i].t}ms ${c[i - 1].v}→${c[i].v}`);
    }

    return {
        samples: s.length, src: s[s.length - 1].src, lumaRange: `${Math.min(...s.map((x) => x.luma))}~${Math.max(...s.map((x) => x.luma))}`,
        A_solverDowns: downs, A_faceDownSteps: fDowns.slice(0, 14),
        A_srcFlap: `换源 ${srcFlap} 次｜none ${noneN}/${s.length} 拍｜src 序列=${[...new Set(s.map((x) => x.src))].join(',')}`,
        A_holdAtDowns: s.filter((x, i) => i > 0 && x.vG < s[i - 1].vG - 0.0005).slice(0, 8).map((x) => `t=${x.t} v=${x.vG} want=${x.wG} hold=${x.hG}`),
        B_plateMismatch: mismP.length, B_glassMismatch: mismG.length,
        B_sample: mismP.slice(0, 4).map((x) => `t=${x.t} 变量=${x.vP} 面=${x.fP} 卡片类=${(document.querySelector(PL) || { className: '-' }).className.slice(0, 40)}`),
        C_window: `${c.length} 拍 / ${c.length ? c[c.length - 1].t : 0}ms`, C_start: c[0], C_end: c[c.length - 1],
        C_releases: cDowns,
        C_verdict: (cReleased >= 2 && cUps.length === 0 && (landed
                || (onCadence && c.length && c[c.length - 1].rel === 1)))
            ? `${landed ? 'PASS 走完' : 'PASS 按节拍退中（窗口用完，未落需求但没停）'} ${cReleased} 档 ${cFrom}→${cTo}，需求 ${cWant}，`
                + `档间隔=[${gapList.join(',')}]ms 落在 3.2~7s=${onCadence}，往返 0：${cDowns.join(' | ')}`
            : `FAIL ${cReleased} 档 ${cFrom}→${cTo}，需求 ${cWant}（差 ${(cTo - cWant).toFixed(3)}，往返 ${cUps.length} 次=${cUps.join('/')||'-'}，rel=${c.length ? c[c.length - 1].rel : '-'}，档间隔=[${gapList.join(',')}]）`,
        C_roundTrips: cUps,
        C_trace: c.filter((x, i) => i % 6 === 0).map((x) => `${x.t}ms v=${x.v} want=${x.want} hold=${x.hold}`),
    };
})().catch((e) => ({ probeError: `${e && e.name}: ${e && e.message}` }));

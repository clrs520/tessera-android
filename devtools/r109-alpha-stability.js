// R109 验收：透度到底是「一台测光表」还是「一种材质」。
// 用户两次说的是同一件事 —— 「卡片颜色还是会变，不稳定」。R102~R108 的求解器每 900ms 重读画面亮端、
// 每拍朝目标走 34%、死区 0.01，所以真实录像的亮端一起伏，alpha 就跟着来回。现在：变厚立刻，变薄要
// 比现在低 0.06 以上、连续稳 4 秒、一次只退一档。
// 判据两半，缺一不可：
//   ① 真播放连采 10 秒 —— 不许出现「退一档、四秒内又升回去」这种往返（往返就是抖）；
//   ② 合成最坏的测光输入 —— 每拍在「白墙 250」和「夜路 4」之间硬切。这条不靠场景刚好变化，是**必现**的
//      证据：老规则在这组输入下会一路涨落，新规则必须几乎不动。
// ② 是把 `measureBackdropLuma` 临时换掉喂进去的，跑完必须还原；中途崩了会把这台 APP 的玻璃变成瞎子
// （R102 记过：崩掉的探针留下的残局，下一个套件每个数都读成真）。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const v = window.viewer;
    const alphaOf = (sel) => {
        const el = document.querySelector(sel); if (!el) return null;
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(el).backgroundColor);
        if (!m) return null;
        const p = m[1].split(',').map((x) => parseFloat(x));
        return p.length >= 4 ? +p[3].toFixed(4) : 1;
    };
    const GLASS_FACE = '.phone-action-bar', PLATE_FACE = '.metadata-panel';
    const varOf = (name) => +(getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim() || '-1');

    for (let i = 0; i < 40 && !window.viewer; i++) await sleep(500);
    // 量具没起来要说清是谁没起来：冷启动 ANR 之后 `window.viewer` 还是 undefined，直接往下走会得到
    // 「Cannot read properties of undefined (reading eventGroups)」，看着像 APP 坏了（R109 实测连着两次）。
    if (!window.viewer) return { pass: [], fail: ['前置：window.viewer 还没出现（APP 刚被 ANR 掉或仍在冷启动），这一场不作数'],
        note: `viewer=${typeof window.viewer} ready=${document.readyState}` };
    for (let i = 0; i < 40 && !(v.eventGroups || []).length; i++) await sleep(500);
    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')))
        || (v.eventGroups || [])[0];
    if (!ev) return { pass: out.pass, fail: ['前置：一个事件都没有，两半判据都无从谈起'], note: 'no-event' };
    if (document.querySelector('.player-area.empty')) {
        for (let k = 0; k < 3; k++) { try { await v.playEvent(ev.eventId); break; } catch (e) { await sleep(2500); } }
        await sleep(3000);
    }
    // 单路而不是六路：六路解码在这台 AVD 上会把主线程拖到 ANR（R64 那一族「六路风暴」），而这一族判据
    // 只问「求解器跟不跟着画面跑」，一路足够 —— `measureBackdropLuma` 也只看可见格子。
    document.querySelector('.view-btn[data-view="front"]')?.click();
    await sleep(900);
    if (!v.multiCameraPlayer.isPlaying) { v.multiCameraPlayer.playAll(); await sleep(1500); }
    ok('前置：材质挂着，且这一拍的底色是实测来的（不是没量到）',
        document.documentElement.classList.contains('glass-lens')
        && (glassState.src === 'video' || glassState.src === 'css'),
        `glass-lens=${document.documentElement.classList.contains('glass-lens')} src=${glassState.src} luma=${glassState.luma}`);
    // 允许一拍重绘延迟：强制求解打满时（②每 100ms 一次）CSS 自定义属性已经更新、而那一面的
    // used value 可能还停在上一帧 —— 量到过一次「面 0.667 / 变量 0.625」。轮询两秒：重绘滞后一拍就齐，
    // 真的被别的规则画了则永远不齐。稳态连采 100 拍是 0 处不一致（`r110-release-audit.js`）。
    let agree = false, agWait = 0;
    for (let i = 0; i < 10; i++) {
        agree = Math.abs(alphaOf(GLASS_FACE) - varOf('--lens-alpha')) < 0.005
            && Math.abs(alphaOf(PLATE_FACE) - varOf('--lens-alpha-plate')) < 0.005;
        if (agree) break;
        await sleep(200); agWait += 1;
    }
    ok('前置：上屏的 alpha 和求解器写的是同一个数（量具没在读一个假的值）',
        agree,
        `等 ${(agWait * 200)}ms｜面 ${alphaOf(GLASS_FACE)}/${alphaOf(PLATE_FACE)} 变量 ${varOf('--lens-alpha')}/${varOf('--lens-alpha-plate')}`);

    // 一次采样的序列 -> 「方向翻转 + 幅度」这组事实。往返的定义：降完之后没隔够 4 秒就升回降幅以内。
    // 门槛取 0.005 而不是 0.002：computed style 把 alpha 量化到 8 bit（1/255≈0.0039），两次几乎相等的
    // 写入就会读出「降了一格」—— 上一版把这种台阶数成了 7 次退档、间隔 203ms，看着像迟滞被击穿。
    const STEP_EPS = 0.005;
    const analyse = (seq) => {
        const steps = [];
        for (let i = 1; i < seq.length; i++) {
            const d = seq[i].a - seq[i - 1].a;
            if (Math.abs(d) < STEP_EPS) continue;
            steps.push({ t: seq[i].t - seq[0].t, from: seq[i - 1].a, to: seq[i].a, d });
        }
        let roundTrip = 0, downGaps = [], lastDown = -1e9;
        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            if (s.d < 0) { if (lastDown > -1e8) downGaps.push(Math.round(s.t - lastDown)); lastDown = s.t; }
            else if (i > 0 && steps[i - 1].d < 0 && s.d >= -steps[i - 1].d && s.t - steps[i - 1].t < GLASS_RELEASE_MS) roundTrip += 1;
        }
        const downs = steps.filter((s) => s.d < 0);
        return { steps, roundTrip, downs, downGaps,
            maxDown: downs.length ? Math.max(...downs.map((s) => -s.d)) : 0 };
    };

    // ---- ① 真播放 10 秒：不许往返 --------------------------------------------------------------------
    const real = [];
    const t0 = Date.now();
    for (let i = 0; i < 50; i++) {
        real.push({ t: Date.now() - t0, a: alphaOf(GLASS_FACE), p: alphaOf(PLATE_FACE) });
        await sleep(200);
    }
    const aR = analyse(real), aRp = analyse(real.map((x) => ({ t: x.t, a: x.p })));
    ok(`① 真播放 10 秒：白玻璃那一组往返次数 = 0（采 ${real.length} 拍，变化 ${aR.steps.length} 次）`,
        aR.roundTrip === 0, aR.steps.map((s) => `${s.t}ms ${s.from.toFixed(3)}→${s.to.toFixed(3)}`).join(' ') || '全程没变');
    ok(`① 真播放 10 秒：数据板那一组往返次数 = 0（变化 ${aRp.steps.length} 次）`,
        aRp.roundTrip === 0, aRp.steps.map((s) => `${s.t}ms ${s.from.toFixed(3)}→${s.to.toFixed(3)}`).join(' ') || '全程没变');
    ok('① 每一次退档都不超过一档、且相邻退档隔够 4 秒',
        aR.downs.every((s) => -s.d <= GLASS_THIN_STEP + 0.005) && aR.downGaps.every((g) => g >= GLASS_RELEASE_MS - 300)
        && aRp.downs.every((s) => -s.d <= GLASS_THIN_STEP + 0.005) && aRp.downGaps.every((g) => g >= GLASS_RELEASE_MS - 300),
        `退档 ${aR.downs.length + aRp.downs.length} 次，最大降幅 ${Math.max(aR.maxDown, aRp.maxDown).toFixed(3)}，间隔 ${aR.downGaps.join('/') || '-'}/${aRp.downGaps.join('/') || '-'}ms`);

    // ---- ② 合成最坏输入：每拍在白墙/夜路之间硬切 -----------------------------------------------------
    const realMeasure = measureBackdropLuma;
    let inject = 250, ticks = 0, aA = null, aD = null;
    try {
        measureBackdropLuma = () => ({ luma: inject, cells: 1 });
        const alt = [], down = [];
        const ta = Date.now();
        // 20 拍 × 100ms = 2 秒的「亮一下暗一下」：这正好是老规则最抖的输入（每拍都朝对方走 34%）。
        for (let i = 0; i < 20; i++) {
            inject = i % 2 ? 250 : 4;
            glassState.nextSolve = 0; adaptGlassAlpha();
            alt.push({ t: Date.now() - ta, a: alphaOf(GLASS_FACE) });
            ticks += 1; await sleep(100);
        }
        const aA = analyse(alt);
        ok('② 合成输入确实进了求解器（否则这条判据是在量一个没跑起来的分支）',
            glassState.luma === 4 || glassState.luma === 250, `luma=${glassState.luma} 强制解了 ${ticks} 拍`);
        ok(`② 亮暗硬切 2 秒：白玻璃不许跟着一起一伏（往返 = 0，${aA.steps.length} 次变化 / 20 拍）`,
            aA.roundTrip === 0 && aA.steps.filter((s) => s.d < 0).length === 0,
            aA.steps.map((s) => `${s.t}ms ${s.from.toFixed(3)}→${s.to.toFixed(3)}`).join(' ') || '全程钉在厚档');

        // 然后**稳定变亮** 9 秒：白玻璃压在亮帧上只需要 .45，这才是「可以退」的那一半。
        // （第一版这里写的是继续注入 `luma=4`，判据当场红 —— 不是实现坏了，是夜路那一端本来就要求
        // 加厚，拿它当「需求下降」去验退档，永远验不到。方向要对着需求走，不是对着画面亮暗走。）
        const td = Date.now();
        for (let i = 0; i < 90; i++) {
            inject = 250;
            glassState.nextSolve = 0; adaptGlassAlpha();
            down.push({ t: Date.now() - td, a: alphaOf(GLASS_FACE) });
            await sleep(100);
        }
        const aD = analyse(down);
        // 「退得动」的正确说法是**条件式**：需求真的掉出死区了才必须退；还在死区里就不该动 ——
        // 上一版写成无条件「必须退 1~3 档」，于是在 1.2.187 上红了：注入白墙后 `want=.822`、`cur=.881`，
        // 差 0.059 < 0.06，按 R109 规则「当没变」正是设计意图（`devtools/r110-release-audit.js` 的 C 段
        // 把这三列并排打出来证的）。判据要跟着规则走，不是规则跟着判据走。
        const lag = glassState.alpha - glassState.target;
        ok(`② 持续变亮 9 秒：需求掉出死区就必须退得动（退 ${aD.downs.length} 档，末态差 ${lag.toFixed(3)} 档）`,
            lag < GLASS_DEADBAND
            || (aD.downs.length >= 1 && aD.downs.length <= 3 && aD.maxDown <= GLASS_THIN_STEP + 0.005
                && aD.downGaps.every((g) => g >= GLASS_RELEASE_MS - 300)),
            lag < GLASS_DEADBAND ? `需求始终在死区内（<${GLASS_DEADBAND}），不退才对：v=${glassState.alpha.toFixed(3)} want=${glassState.target.toFixed(3)}`
                : `退 ${aD.downs.length} 档 ${aD.downs.map((s) => s.to.toFixed(3)).join('→')}，间隔 ${aD.downGaps.join('/') || '-'}ms`);
        ok('② 退档过程中每一档都还在 AA 之上（不许为了稳把可读性退没了）',
            (() => {
                const el = document.querySelector(GLASS_FACE);
                const fill = parseInk(getComputedStyle(el).backgroundColor);
                const inks = [...new Set([...el.querySelectorAll('span, a, button, label, .btn-text, .tab-label')]
                    .filter((n) => n.textContent && n.textContent.trim())
                    .map((n) => parseInk(getComputedStyle(n).color).join(',')))].map((s) => s.split(',').map(Number));
                const bd = [250, 250, 250];
                return glassAlphaPasses(fill.length === 3 ? fill : [255, 255, 255], bd, inks, glassState.alpha);
            })(), `alpha=${glassState.alpha.toFixed(3)} 底色=250`);
    } finally {
        measureBackdropLuma = realMeasure;
        glassState.nextSolve = 0;
        adaptGlassAlpha();
    }
    ok('② 量具已还原：下一次求解读回真实底色',
        measureBackdropLuma === realMeasure && (glassState.src === 'video' || glassState.src === 'css'),
        `src=${glassState.src} luma=${glassState.luma}`);
    out.trace = { real: aR.steps.length, alt: aA && aA.steps.length, down: aD && aD.downs.length };
    return out;
})();

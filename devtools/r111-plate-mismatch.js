// R111 追查一条新读数：`r110-release-audit` B 相在 1.2.189 上报 `面=0.45 / 变量=0.5479`（100 拍里 5 拍）。
// 要分清三种可能：
//   (a) 那一拍卡片**没挂 .lens-on**（R105：材质跟着内容走，不压画面就不该有玻璃）→ 面由基色规则画，
//       和变量本来就不该相等，是判据写错了；
//   (b) 那一面被**另一条规则**接管（比如误用了白玻璃那组的 `--lens-alpha`）→ 真缺陷，R107 的拆分漏了一个面；
//   (c) `transition` 正在滑移 → computed style 读到中间值（R98 记过 rect 的同款）。
// 0.45 正好等于 GLASS_ALPHA_MIN，所以 (a) 和 (b) 都能解释这个数 —— 必须把「卡片此刻挂没挂材质」一起采。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const PL = '.metadata-panel', GL = '.phone-action-bar';
    const v = window.viewer;
    if (!v) return { fail: ['viewer 还没起来'] };
    const el = document.querySelector(PL);
    if (!el) return { fail: ['没有 .metadata-panel'] };
    // 自己把播放开起来（和 `r110-release-audit` 同一段入口）。暂停态量不到材质：R108 记过
    // 「暂停时 videoWidth=0 → rects 空」，那条 B 相读数就是在这种半死状态下量出来的。
    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
    if (document.querySelector('.player-area.empty') && ev) {
        for (let k = 0; k < 3; k++) { try { await v.playEvent(ev.eventId); break; } catch (e) { await sleep(2500); } }
        await sleep(3000);
    }
    document.querySelector('.view-btn[data-view="front"]')?.click();
    await sleep(900);
    if (!v.multiCameraPlayer.isPlaying) { v.multiCameraPlayer.playAll(); await sleep(1500); }
    const aOf = (n) => {
        const m = /rgba?\(([^)]+)\)/.exec(getComputedStyle(n).backgroundColor);
        if (!m) return null;
        const p = m[1].split(',').map(parseFloat);
        return p.length >= 4 ? +p[3].toFixed(4) : 1;
    };
    const varOf = (n) => +(getComputedStyle(document.documentElement).getPropertyValue(n).trim() || -1);
    const s = [];
    const t0 = Date.now();
    for (let i = 0; i < 150; i++) {
        const cs = getComputedStyle(el);
        s.push({
            t: Date.now() - t0,
            face: aOf(el), faceG: document.querySelector(GL) ? aOf(document.querySelector(GL)) : null,
            vP: varOf('--lens-alpha-plate'), vG: varOf('--lens-alpha'),
            gsP: +glassState.plateAlpha.toFixed(4), gsG: +glassState.alpha.toFixed(4),
            lensOn: el.classList.contains('lens-on'), shown: cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0,
            live: [...document.querySelectorAll('video')].filter((x) => x.videoWidth > 0).length,
            trans: /background/i.test(cs.transitionProperty || '') ? (cs.transitionDuration || '?') : 'none',
            cls: el.className.slice(0, 46),
        });
        await sleep(200);
    }
    const mism = s.filter((x) => Math.abs(x.face - x.vP) > 0.005);
    // 面 vs **CSS 变量**（这才是画出来的东西）；面 vs **JS 状态**（audit 里 B 相比的其实是这一对）
    const mismState = s.filter((x) => Math.abs(x.face - x.gsP) > 0.005);
    const varVsState = s.filter((x) => Math.abs(x.vP - x.gsP) > 0.005);
    // 分开数：不挂材质造成的、和挂了材质还不一致（那才是真缺陷）
    const offLens = mism.filter((x) => !x.lensOn);
    const onLens = mism.filter((x) => x.lensOn);
    const equalsGlassVar = onLens.filter((x) => Math.abs(x.face - x.vG) <= 0.005);
    const fmt = (x) => `t=${x.t} 面=${x.face} plateVar=${x.vP} glassVar=${x.vG} state=${x.gsP} lensOn=${x.lensOn} live=${x.live} cls=${x.cls}`;
    return {
        samples: s.length, lensOnN: s.filter((x) => x.lensOn).length, liveMax: Math.max(...s.map((x) => x.live)),
        mismatchTotal: mism.length, mismatchNoLens: offLens.length,
        mismatchWithLens: onLens.length, mismatchReadsGlassVar: equalsGlassVar.length,
        faceVsState: mismState.length, varVsState: varVsState.length,
        // 面与状态不一致的那些拍，是不是**恰好**等于变量还没落地的旧值（= 写入与样式生效之间的一帧）
        faceIsOldVar: mismState.filter((x, i) => i > 0 && Math.abs(x.face - s[Math.max(0, i - 3)].vP) <= 0.005).length,
        transition: [...new Set(s.map((x) => x.trans))].join(','),
        first: mismState.slice(0, 4).map(fmt),
        last: mismState.slice(-2).map(fmt),
    };
})().catch((e) => ({ probeError: `${e && e.name}: ${e && e.message}` }));

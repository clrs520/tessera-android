// R187 · 危险行方案二：浅红药丸 + 深红字。断言四件事——
// ① 字在它自己那块底上是 4.5:1 以上（与画面无关）；② 图标同色；
// ③ 左缘仍与其它行对齐（外边距 6 + 内边距 6 = 12）；④ 这一行不再进「透过玻璃读」的账（subAa=0）。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));

    await v.loadTauriDirectory('/sdcard/TeslaCamScroll');
    await s(1500);
    // 深色主题下这条不该生效，先钉回浅色
    if (document.body.classList.contains('dark-theme')) { v.applyTheme(false); await s(600); }
    const ev = (v.eventGroups || []).find((e) => v.eventDeleteTargets(e));
    v.showCardContextMenu(ev);
    await s(500);

    const row = document.querySelector('.card-context-menu [data-context="delete"]');
    const other = document.querySelector('.card-context-menu [data-context="play"]');
    const cs = getComputedStyle(row);
    const ink = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const bg = (cs.backgroundColor.match(/[\d.]+/g) || []).map(Number);
    const cr = contrastRatio(bg.slice(0, 3), ink);
    ok('① 危险行自带不透明底，字在底上过 AA（与画面无关）',
        (bg.length === 3 || bg[3] === 1) && cr >= 4.5,
        `底=rgb(${bg.slice(0, 3)}) 字=rgb(${ink}) ${cr.toFixed(2)}:1`);
    ok('② 图标与文字同色', getComputedStyle(row.querySelector('.context-icon')).color === cs.color,
        `icon=${getComputedStyle(row.querySelector('.context-icon')).color}`);
    const iconL = Math.round(row.querySelector('.context-icon').getBoundingClientRect().left);
    const otherL = Math.round(other.querySelector('.context-icon').getBoundingClientRect().left);
    ok('③ 左缘与其它行对齐（6 外边距 + 6 内边距 = 12）', Math.abs(iconL - otherL) <= 1,
        `危险行图标左=${iconL} 其它行=${otherL}`);
    ok('③ 行高没被药丸改掉', Math.abs(row.getBoundingClientRect().height - other.getBoundingClientRect().height) <= 1,
        `危险行高=${Math.round(row.getBoundingClientRect().height)} 其它=${Math.round(other.getBoundingClientRect().height)}`);

    // ④ 材质账：这一行不再贴玻璃读 ⇒ 没有低于 AA 的墨
    for (let i = 0; i < 12 && glassState.src !== 'video'; i += 1) await s(700);
    ok('④ 玻璃账里不再有「贴着玻璃还不过 AA」的墨（subAa 归零）',
        glassState.subAa === 0,
        `subAa=${glassState.subAa} worst=${glassState.subAaWorst} at=${glassState.subAaAt || '-'} src=${glassState.src}`);
    out.state = { alpha: glassState.alpha, plateAlpha: glassState.plateAlpha };
    return out;
})()

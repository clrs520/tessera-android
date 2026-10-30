// R107 视觉门：把两组 alpha 分开之后的实际画面拍下来。CDP 截图里没有视频平面（R102 记过），
// 所以状态由这里摆好，截图一律走 `adb exec-out screencap -p`。
// 目标主题从 window.__theme 读（先用一条小 eval 设进去），避免同一个量具写两份。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const want = window.__theme === 'dark' ? 'dark' : 'light';
    const themeOn = () => (document.body.classList.contains('dark-theme') || document.documentElement.classList.contains('dark'))
        ? 'dark' : 'light';

    if (document.querySelector('.player-area.empty')) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')))
            || (v.eventGroups || [])[0];
        await v.playEvent(ev.eventId);
        await sleep(3200);
    }
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    await sleep(400);

    localStorage.setItem('tdashcam.themeMode', want);
    v.applyTheme(v.resolveThemeDark(want));
    await sleep(500);
    const flipped = themeOn() === want;

    const card = document.getElementById('metadataPanel');
    document.querySelector('.header-right')?.classList.add('active');
    // 等求解器把两组都落到各自的「应然值」上，而不是靠固定 sleep（同一台机器负载一高 350ms 就不够）。
    let waited = 0;
    while (waited < 8000 && !(glassState.solved
        && Math.abs(glassState.alpha - glassState.target) < 0.005
        && Math.abs(glassState.plateAlpha - glassState.plateTarget) < 0.005)) {
        await sleep(150); waited += 150;
    }
    const bar = document.querySelector('.phone-action-bar');
    const panel = document.querySelector('.header-collapsed .header-actions-group');
    const bf = (el) => (!el ? 'missing' : ((getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter || 'none').slice(0, 30)));
    return {
        want, flipped, actual: themeOn(), waited,
        css: `${innerWidth}x${innerHeight}@${devicePixelRatio}`,
        alpha: glassState.alpha, target: glassState.target,
        plateAlpha: glassState.plateAlpha, plateTarget: glassState.plateTarget,
        backdrop: `${glassState.src}/${glassState.luma}`,
        lensOn: `${glassState.lensLive}/5`,
        cardCollapsed: card ? card.classList.contains('collapsed') : 'no-card',
        cardBg: card ? getComputedStyle(card).backgroundColor : '-',
        barBg: bar ? getComputedStyle(bar).backgroundColor : '-',
        panelBg: panel ? getComputedStyle(panel).backgroundColor : '-',
        filters: `bar=${bf(bar)} panel=${bf(panel)} card=${bf(card)}`
    };
})();

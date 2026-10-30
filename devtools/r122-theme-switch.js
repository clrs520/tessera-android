// R122 · 主题一切换，材质多久才回到它该有的厚度？
//
// 真机 1.2.203：`alpha=0.80 want=0.45 rel=1 thinHold=0`，alphaLog 里 286442ms 被顶到 .842、
// 292409ms 才退第一档 .802 —— 用户说的「切到浅色还是白板」是**退档太慢**，不是需求还错。
// 这一份在页面里自己采样（不靠 PC 侧来回），把「切过去之后每一拍 alpha / want / 谁钉的」记下来。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const seg = (on) => document.querySelector(`#themeChoice [data-mode="${on}"]`).click();
    const now = () => document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const start = now();
    const other = start === 'dark' ? 'light' : 'dark';
    const samples = [];
    const snap = (tag) => samples.push({
        t: Math.round(performance.now()), tag, theme: now(),
        alpha: +glassState.alpha.toFixed(3), want: +glassState.target.toFixed(3),
        plate: +glassState.plateAlpha.toFixed(3), luma: glassState.luma,
        inks: glassState.inks, bind: glassState.binding.glass || '-',
        rel: glassState.releasingGlass, hold: glassState.thinGlass ? Math.round((Date.now() - glassState.thinGlass) / 1000) + 's' : '0',
        subAa: glassState.subAa,
    });
    // 先切到「另一头」并等它稳，这样接下来那一次切换是真正的跨主题场景变化。
    seg(other); await sleep(6000); snap('settled-' + other);
    // 停播让解码器的帧不再变 —— 底色要稳定，否则量到的又混进「画面变了」。
    const wasPlaying = window.viewer && window.viewer.multiCameraPlayer && window.viewer.multiCameraPlayer.isPlaying;
    seg(start);
    for (let i = 0; i < 52; i += 1) { snap('after-switch'); await sleep(250); }
    return { from: other, to: start, wasPlaying: !!wasPlaying, n: samples.length, samples };
})()

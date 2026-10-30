// 谁把玻璃重新钉成白板？—— 假设：`markGlassMaterial()` 每次被调用都把两组 alpha 压回 .92 并作废已解
// 结果，而它的调用方 `markAccessibilityPrefs()` 挂在原生状态推送上（`__tdashcamNativeState`），
// MainActivity 在**每次 configuration change 和每次重新获得焦点**时都会推一次。
// 这条探针不猜：给 `markGlassMaterial` 包一层计数器，然后分别做三件事 —— 点开 ⋮ 面板、点开又关掉、
// 直接调一次原生推送入口（等价于回前台/旋转），看谁让 alpha 跳回 .92、跳回去之后多久才回来。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return { fail: ['viewer 还没起来，这一场不作数'] };
    if (!window.__mgWrap) {
        window.__mgWrap = 1; window.__mg = 0; window.__mgLog = [];
        const orig = markGlassMaterial;
        markGlassMaterial = function () {
            const before = glassState.alpha;
            const r = orig.apply(this, arguments);
            // 计数器要在记日志之前加：上一版忘了 `+= 1`，于是 `openMounts/pushMounts` 永远是 0，
            // 看着像「没人调用」，其实调用发生了、只是没记上（R109 自查抓到）。
            window.__mg += 1;
            window.__mgLog.push(`#${window.__mg} ${before.toFixed(3)}→${glassState.alpha.toFixed(3)} solved=${glassState.solved}`);
            return r;
        };
    }
    const A = () => +glassState.alpha.toFixed(3);
    const B = () => `${glassState.src}/${glassState.luma}`;
    const out = { start: A(), mounts: window.__mg, steps: [] };
    const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || '')));
    if (document.querySelector('.player-area.empty') && ev) {
        try { await v.playEvent(ev.eventId); } catch (e) { /* 瞬时失败不拦这条 */ }
        await sleep(3500);
    }
    // 先把画面钉住：播放中场景本身在变亮，透度**变厚是立刻的**（R109 规则），于是 alpha 会一路往上走 ——
    // 那是正确行为，不是重钉。上一版没暂停，读数 .45→.861 分不清是谁干的。暂停 + 等一拍稳定后再开面板。
    if (v.multiCameraPlayer.isPlaying) v.multiCameraPlayer.pauseAll();
    await sleep(1500);
    out.beforeOpen = `${A()} @${B()}`;
    document.getElementById('tabMoreBtn').click(); await sleep(1500);
    out.afterOpen = `${A()} @${B()}`; out.openMounts = window.__mg;
    document.getElementById('tabMoreBtn').click(); await sleep(1000);
    out.afterClose = `${A()} @${B()}`;
    // 这一行就是「回前台 / 转屏」在页面里等价的那一下：
    if (typeof window.__tdashcamNativeState === 'function') {
        const m0 = window.__mg;
        window.__tdashcamNativeState();
        await sleep(250);
        out.afterPush = `${A()} @${B()}`; out.pushMounts = window.__mg - m0;
        for (let i = 0; i < 12; i++) { await sleep(1000); out.steps.push(`${(i + 1)}s:${A()}`); }
    } else out.afterPush = 'no __tdashcamNativeState';
    out.log = window.__mgLog.slice(-8);
    out.ending = A();
    return out;
})();

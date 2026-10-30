// R112 ① 的第二版量法。上一版有两个仪器错误：
//   1) `setInterval(…, 50)` 在这台负载很高的 AVD 上实际间隔 50~500ms，0.2 秒的淡入整个被跳过，
//      于是「没采到中间值」被读成「没有淡入」—— 量具坏了看着像行为正常（R99/R100 同一条）。
//   2) 我为了冻住求解器 `clearInterval(glassAdaptTimer)`，而 `.lens-on` 是 `adaptGlassAlpha()` 里
//      顺带调 `markLensSurfaces()` 挂的 —— 冻求解器把材质标记一起冻了，第二次实验的面板根本没挂上透镜。
// 这一版改用 rAF（每帧一采，约 16ms），并且**不冻任何东西**：要问的只是「面板自己淡不淡」，
// 透度那边我已经知道它不动（bg 全程 .9）。
(async () => {
    const panel = document.querySelector('.header-collapsed .header-right.active .header-actions-group')
        || document.querySelector('.header-collapsed .header-actions-group');
    const right = document.querySelector('.header-right');
    right.classList.remove('active');
    await new Promise((r) => setTimeout(r, 400));
    const s = [];
    const t0 = performance.now();
    let stop = false;
    const tick = () => {
        const c = getComputedStyle(panel);
        s.push({ t: Math.round(performance.now() - t0), op: +(+c.opacity).toFixed(2),
            tf: c.transform === 'none' ? 'none' : (c.transform.match(/-?[\d.]+/g) || []).slice(0, 1).join(''),
            bg: +(/,\s*([\d.]+)\)$/.exec(c.backgroundColor)?.[1] || 1) });
        if (!stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    right.classList.add('active');
    await new Promise((r) => setTimeout(r, 700));
    stop = true;
    const ops = [...new Set(s.map((x) => x.op))];
    // 「几个不同的中间值」就是这条淡入被用户看到的台阶数。1 = 不淡（直接到位）。
    return JSON.stringify({
        帧数: s.length, 面板宽: Math.round(panel.getBoundingClientRect().width),
        opacity出现过的值: ops.join(' '),
        中间值台阶数: ops.filter((v) => v > 0.02 && v < 0.98).length,
        底色alpha出现过的值: [...new Set(s.map((x) => x.bg))].join(' '),
        前12帧: s.slice(0, 12).map((x) => `${x.t}ms op=${x.op}`),
        transition: getComputedStyle(panel).transitionProperty + ' | ' + getComputedStyle(panel).transitionDuration,
    });
})()

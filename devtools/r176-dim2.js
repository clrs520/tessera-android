(async () => {
    const v = window.viewer;
    const p = document.querySelector('.player-area');
    if (!p.classList.contains('empty')) p.classList.add('empty');
    v.setThemeChoice('light');
    await new Promise((r) => setTimeout(r, 300));
    v.applyBrightness?.(0.65, false);
    await new Promise((r) => setTimeout(r, 400));
    const dim = document.getElementById('phoneBrightnessDim');
    const light = { empty: p.classList.contains('empty'), inline: dim.style.opacity,
        computed: getComputedStyle(dim).opacity };
    v.setThemeChoice('dark');
    await new Promise((r) => setTimeout(r, 400));
    const dark = { inline: dim.style.opacity, computed: getComputedStyle(dim).opacity };
    v.setThemeChoice('light');
    v.applyBrightness?.(1, false);
    return JSON.stringify({ light, dark }, null, 1);
})()

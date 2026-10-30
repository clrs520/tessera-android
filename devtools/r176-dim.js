(async () => {
    const v = window.viewer;
    v.setThemeChoice('light');
    await new Promise((r) => setTimeout(r, 400));
    const p = document.querySelector('.player-area');
    if (!p.classList.contains('empty')) p.classList.add('empty');
    await new Promise((r) => setTimeout(r, 300));
    const dim = document.getElementById('phoneBrightnessDim');
    const light = { empty: p.classList.contains('empty'), opacity: getComputedStyle(dim).opacity,
        inline: dim.style.opacity, level: v.brightnessLevel };
    v.setThemeChoice('dark');
    await new Promise((r) => setTimeout(r, 400));
    const dark = { opacity: getComputedStyle(dim).opacity };
    v.setThemeChoice('light');
    return JSON.stringify({ light, dark }, null, 1);
})()

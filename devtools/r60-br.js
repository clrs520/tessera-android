(() => { try {
    const d = document.getElementById('phoneBrightnessDim');
    return JSON.stringify({ lvl: Math.round(viewer.brightnessLevel * 100) / 100, dim: d && d.style.opacity, hud: document.getElementById('phoneBrightnessHud').classList.contains('show') });
} catch (e) { return 'THREW ' + e.message; } })()

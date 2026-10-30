(() => {
    const ids = ['playPauseBtn', 'layoutBtn', 'pipBtn', 'fullscreenBtn', 'clipBtn', 'confirmClipBtn', 'speedBtn', 'phoneExportModal', 'peStartBtn'];
    const out = {};
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) { out[id] = null; continue; }
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        out[id] = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height),
            cs.display, cs.visibility, el.disabled, (el.textContent || '').trim().slice(0, 12)];
    }
    const vc = viewer.videoControls;
    return JSON.stringify({ out, clip: [vc.clipStartTime, vc.clipEndTime], t: vc.player.currentTime, dur: vc.player.duration,
        modalDisp: getComputedStyle(document.getElementById('phoneExportModal')).display });
})()

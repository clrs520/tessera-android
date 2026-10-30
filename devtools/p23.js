(() => {
    const out = {};
    const a = viewer.continuousPlayer.applySeek.toString();
    const p = viewer.continuousPlayer.playNextSegment.toString();
    out.applySeek_gated = a.includes('isTouchShellRuntime()') && /isTouchShellRuntime\(\)\)\s*\{[^}]*player\.playAll\(\);/.test(a);
    out.applySeek_desk_await = a.includes('await player.playAll');
    out.applySeek_truth = a.includes('updatePlayState(nowPlaying)');
    out.playNext_gated = p.includes('isTouchShellRuntime()') && p.includes('await this.multiCameraPlayer.playAll()');
    out.hasBand = typeof viewer.pictureGestureBand === 'function';

    if (!viewer.__r64ChipWrapped) {
        viewer.__r64ChipWrapped = true;
        const orig = viewer.showPhoneFeedChip.bind(viewer);
        viewer.showPhoneFeedChip = function (text, side) {
            const r = orig(text, side);
            const hud = document.getElementById('phoneFeedHint');
            const box = hud && hud.getBoundingClientRect();
            const band = viewer.pictureGestureBand();
            (window.__chips = window.__chips || []).push({
                text, side: side || 'centre',
                band: band ? [Math.round(band.left), Math.round(band.width), Math.round(band.right)] : null,
                chip: box && box.width ? [Math.round(box.left), Math.round(box.width), Math.round(box.right)] : null,
                onPicture: box && band && box.width ? (box.left >= band.left - 1 && box.right <= band.right + 1) : null,
            });
            return r;
        };
    }
    out.chips = (window.__chips || []).length;
    out.ct = +viewer.continuousPlayer.getCurrentTime().toFixed(2);
    out.total = +viewer.continuousPlayer.totalDuration.toFixed(2);
    return JSON.stringify(out, null, 1);
})()

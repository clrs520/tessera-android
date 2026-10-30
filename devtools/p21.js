(() => {
    if (!viewer.__r64StepWrapped) {
        viewer.__r64StepWrapped = true;
        window.__steps = [];
        const orig = viewer.phoneSeekStep.bind(viewer);
        viewer.phoneSeekStep = function (dir) {
            const band = viewer.pictureGestureBand();
            const rec = { dir, t: Date.now(), band: band ? [Math.round(band.left), Math.round(band.width)] : null };
            const r = orig(dir);
            const hud = document.getElementById('phoneFeedHint');
            const box = hud && hud.getBoundingClientRect();
            rec.chip = box && box.width ? [Math.round(box.left), Math.round(box.width), Math.round(box.right)] : null;
            rec.cls = hud ? hud.className : null;
            (window.__steps = window.__steps || []).push(rec);
            return r;
        };
    }
    return JSON.stringify({ wrapped: true, steps: (window.__steps || []).length });
})()

(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const measure = () => {
        const rows = [];
        document.querySelectorAll('#playerArea .video-container').forEach((cell) => {
            const cs = getComputedStyle(cell);
            if (cs.display === 'none') return;
            const cb = cell.getBoundingClientRect();
            const video = cell.querySelector('video');
            const vb = video.getBoundingClientRect();
            const nw = video.videoWidth, nh = video.videoHeight;
            if (!nw || !nh || !vb.width || !vb.height) {
                rows.push({ cam: cell.dataset.camera, trig: cell.classList.contains('trigger-cam'), err: 'no-meta', cell: [Math.round(cb.width), Math.round(cb.height)] });
                return;
            }
            const w = Math.min(vb.width, vb.height * nw / nh);
            const h = w * nh / nw;
            rows.push({
                cam: cell.dataset.camera,
                trig: cell.classList.contains('trigger-cam'),
                cell: [Math.round(cb.width), Math.round(cb.height)],
                cellRatio: +(cb.width / cb.height).toFixed(3),
                nat: [nw, nh],
                natRatio: +(nw / nh).toFixed(4),
                pic: [Math.round(w), Math.round(h)],
                // how far the outline sits outside the picture, per axis
                slackX: Math.round((cb.width - w) / 2),
                slackY: Math.round((cb.height - h) / 2)
            });
        });
        return rows;
    };

    // Force the highlight on so the sweep measures the real thing.
    if (v.currentEvent) {
        v.currentEvent.reason = 'manual';
        v.applyTriggerHighlight(v.currentEvent);
    }
    const out = { event: v.currentEvent?.eventId || null, layouts: {} };
    for (const mode of ['single', 'legacy', 'grid4', 'grid']) {
        mp.setLayout(mode);
        await sleep(1200);
        out.layouts[mode] = { active: mp.activeCamera, rows: measure() };
    }
    window.__r83sweep = out;
    return JSON.stringify(out);
})()

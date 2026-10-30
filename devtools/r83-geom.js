(() => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    const area = document.getElementById('playerArea');
    const ab = area.getBoundingClientRect();
    const out = {
        version: 'r83-geom',
        layout: mp.layoutMode,
        active: mp.activeCamera,
        area: { w: Math.round(ab.width), h: Math.round(ab.height) },
        cells: []
    };
    document.querySelectorAll('#playerArea .video-container').forEach((cell) => {
        const cs = getComputedStyle(cell);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const cb = cell.getBoundingClientRect();
        const video = cell.querySelector('video');
        const vb = video ? video.getBoundingClientRect() : null;
        const nw = video ? video.videoWidth : 0;
        const nh = video ? video.videoHeight : 0;
        let painted = null;
        if (nw && nh && vb && vb.width && vb.height) {
            const w = Math.min(vb.width, vb.height * nw / nh);
            const h = w * nh / nw;
            painted = {
                x: Math.round(vb.left + (vb.width - w) / 2 - cb.left),
                y: Math.round(vb.top + (vb.height - h) / 2 - cb.top),
                w: Math.round(w),
                h: Math.round(h)
            };
        }
        out.cells.push({
            cam: cell.dataset.camera,
            cls: cell.className.replace(/\s*is-active-single\s*/, ' is-active-single '),
            trigger: cell.classList.contains('trigger-cam'),
            cell: { w: Math.round(cb.width), h: Math.round(cb.height) },
            cellRatio: +(cb.width / cb.height).toFixed(3),
            vid: vb ? { w: Math.round(vb.width), h: Math.round(vb.height) } : null,
            natural: [nw, nh],
            fit: video ? getComputedStyle(video).objectFit : null,
            outline: cs.outlineWidth + ' ' + cs.outlineStyle + ' ' + cs.outlineColor,
            radius: cs.borderTopLeftRadius,
            painted: painted,
            gap: painted ? { x: painted.x, y: painted.y, slackW: Math.round(cb.width - painted.w), slackH: Math.round(cb.height - painted.h) } : null
        });
    });
    return JSON.stringify(out, null, 1);
})()

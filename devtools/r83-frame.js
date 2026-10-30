(() => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    if (!mp) return JSON.stringify({ err: 'no player' });
    const has = typeof v.paintedFeedRect === 'function' && typeof v.publishTriggerRect === 'function';
    const out = {
        // New symbols present == the new JS is really the code running on this page.
        shipped: has,
        layout: mp.layoutMode,
        active: mp.activeCamera,
        rows: []
    };
    const r = (n) => Math.round(n);
    const rel = (b, base) => ({ x: r(b.left - base.left), y: r(b.top - base.top), w: r(b.width), h: r(b.height) });

    document.querySelectorAll('#playerArea .video-container.trigger-cam').forEach((cell) => {
        const cb = cell.getBoundingClientRect();
        if (!cb.width || !cb.height) return;
        const cam = cell.dataset.camera;
        const video = mp.players[cam];
        const vb = video.getBoundingClientRect();
        const frame = cell.querySelector('.trigger-frame');
        const label = cell.querySelector('.camera-label');
        const fit = getComputedStyle(video).objectFit;
        // Independent arithmetic: what object-fit contain paints, from the natural size only.
        const nw = video.videoWidth, nh = video.videoHeight;
        const expect = { x: 0, y: 0, w: r(cb.width), h: r(cb.height) };
        if (nw && nh && fit === 'contain') {
            const w = Math.min(vb.width, vb.height * nw / nh);
            const h = w * nh / nw;
            expect.x = r(vb.left + (vb.width - w) / 2 - cb.left - cell.clientLeft);
            expect.y = r(vb.top + (vb.height - h) / 2 - cb.top - cell.clientTop);
            expect.w = r(w);
            expect.h = r(h);
        }
        const fb = frame ? frame.getBoundingClientRect() : null;
        const got = fb ? rel(fb, cb) : null;
        const lb = label ? rel(label.getBoundingClientRect(), cb) : null;
        const dx = got ? Math.abs(got.x - expect.x) : 9999;
        const dy = got ? Math.abs(got.y - expect.y) : 9999;
        const dw = got ? Math.abs(got.w - expect.w) : 9999;
        const dh = got ? Math.abs(got.h - expect.h) : 9999;
        out.rows.push({
            cam,
            fit,
            natural: [nw, nh],
            cell: { w: r(cb.width), h: r(cb.height) },
            vid: { w: r(vb.width), h: r(vb.height) },
            frame: got,
            expect,
            label: lb,
            // The chip rides the frame corner: 8px in from both edges of the picture.
            labelOnFrame: lb ? (lb.x === expect.x + 8 && lb.y === expect.y + 8) : null,
            worst: Math.max(dx, dy, dw, dh),
            verdict: got && Math.max(dx, dy, dw, dh) <= 2 ? 'HUGS' : 'OFF BY ' + Math.max(dx, dy, dw, dh),
            vars: cell.getAttribute('style') || ''
        });
    });
    return JSON.stringify(out, null, 1);
})()

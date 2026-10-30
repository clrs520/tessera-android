(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const R = Math.round;

    const out = {
        version: 'r83-verify2',
        // New symbols on the live page == the new JS is what is actually running (frontend JS is
        // compiled into the Rust lib, so the APK listing proves nothing).
        shipped: {
            paintedFeedRect: typeof v.paintedFeedRect === 'function',
            publishTriggerRect: typeof v.publishTriggerRect === 'function',
            scheduleTriggerFrameLayout: typeof v.scheduleTriggerFrameLayout === 'function',
            tracking: false
        },
        orientation: matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait',
        inner: [innerWidth, innerHeight],
        event: String(v.currentEvent?.eventId || ''),
        layouts: {},
        notes: []
    };

    /**
     * Frame-vs-picture invariants, checked without reusing paintedFeedRect's arithmetic:
     *   shape   — the amber box must have the picture's aspect ratio (that IS the complaint);
     *   inside  — it must not spill past the `<video>` element box;
     *   centred — the leftover slack on each axis is split evenly (a contain rect is centred);
     *   slack   — how much black the old container-sized frame used to enclose.
     */
    const check = () => {
        const rows = [];
        document.querySelectorAll('#playerArea .video-container.trigger-cam').forEach((cell) => {
            const cb = cell.getBoundingClientRect();
            if (!cb.width || !cb.height) return;
            const cam = cell.dataset.camera;
            const video = mp.players[cam];
            const frame = cell.querySelector('.trigger-frame');
            const label = cell.querySelector('.camera-label');
            if (!frame) { rows.push({ cam, err: 'NO FRAME ELEMENT' }); return; }
            const fb = frame.getBoundingClientRect();
            if (!fb.width || !fb.height) { rows.push({ cam, err: 'FRAME NOT PAINTED' }); return; }

            const vb = video.getBoundingClientRect();
            const nw = video.videoWidth, nh = video.videoHeight;
            const ratio = nw && nh ? nw / nh : (v.feedRatio?.[cam] ? v.feedRatio[cam][0] / v.feedRatio[cam][1] : null);
            const fit = getComputedStyle(video).objectFit;
            const zoomed = !!(v.feedZoom && v.feedZoom[cam] && v.feedZoom[cam].scale > 1.001);
            const inside = fb.left >= vb.left - 1 && fb.top >= vb.top - 1
                && fb.right <= vb.right + 1 && fb.bottom <= vb.bottom + 1;
            const slackX = Math.max(0, vb.width - fb.width), slackY = Math.max(0, vb.height - fb.height);
            const centred = (zoomed || !ratio) ? true
                : Math.abs((fb.left - vb.left) - (vb.right - fb.right)) <= 2
                && Math.abs((fb.top - vb.top) - (vb.bottom - fb.bottom)) <= 2;
            const shapeDelta = ratio ? Math.abs(fb.width / fb.height - ratio) / ratio : 0;
            const lb = label ? label.getBoundingClientRect() : null;
            const props = ['--trigger-left', '--trigger-top', '--trigger-width', '--trigger-height']
                .map((n) => cell.style.getPropertyValue(n) || '-').join('/');
            rows.push({
                cam, fit, zoomed, natural: [nw, nh], ratio: ratio ? +ratio.toFixed(4) : null,
                cell: [R(cb.width), R(cb.height)],
                videoBox: [R(vb.width), R(vb.height)],
                frame: [R(fb.left - cb.left), R(fb.top - cb.top), R(fb.width), R(fb.height)],
                frameRatio: +(fb.width / fb.height).toFixed(4),
                props,
                inside, centred, shapeDelta: +shapeDelta.toFixed(4),
                blackEnclosed: R(Math.max(0, cb.width * cb.height - fb.width * fb.height)),
                verdict: (!zoomed && ratio && shapeDelta > 0.02) ? 'SHAPE OFF'
                    : (!inside ? 'SPILLS' : (!centred ? 'NOT CENTRED' : 'HUGS')),
                labelXY: lb ? [R(lb.left - cb.left), R(lb.top - cb.top)] : null,
                labelOverFrame: lb ? (lb.left >= fb.left - 1 && lb.top >= fb.top - 1
                    && lb.top < fb.top + 30) : null
            });
        });
        return rows;
    };

    if (!v.currentEvent) return JSON.stringify({ err: 'no event loaded — load one before running' });
    out.shipped.tracking = !!v.triggerFrameTracking;
    v.currentEvent.reason = 'manual';
    mp.setCamera('front');
    v.applyTriggerHighlight(v.currentEvent);
    await sleep(1500);

    for (const mode of ['single', 'legacy', 'grid4', 'grid']) {
        mp.setLayout(mode);
        // The AVD runs rAF at ~1Hz and the re-measure is coalesced into a frame, so a layout switch
        // settles in seconds here, not the ~100ms a real device takes.
        await sleep(3200);
        out.layouts[mode] = { active: mp.activeCamera, rows: check() };
    }

    // Fallback 1: a pinched feed is cropped and covers its whole cell, so the frame stops carving.
    mp.setLayout('single');
    await sleep(3200);
    out.beforeZoom = check();
    v.feedZoom = v.feedZoom || {};
    v.feedZoom.front = { scale: 2, x: 0, y: 0 };
    v.layoutTriggerFrames();
    await sleep(900);
    out.zoomed = check();
    delete v.feedZoom.front;
    v.layoutTriggerFrames();
    await sleep(900);
    out.afterZoom = check();

    // Fallback 2: mid-splice the element reads 0x0 and the cached ratio has to carry the rect.
    out.cache = { front: v.feedRatio ? v.feedRatio.front : null };
    const cell = document.getElementById('front-container');
    const video = mp.players.front;
    const liveRect = check()[0] || null;
    try {
        Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => 0 });
        v.layoutTriggerFrames();
        await sleep(900);
        out.metaGap = check()[0] || null;
    } catch (e) {
        out.notes.push('cannot shadow videoWidth: ' + e.message);
    }
    try { delete video.videoWidth; } catch (e) { /* instance shadow */ }
    out.metaGapSame = !!(liveRect && out.metaGap
        && liveRect.frame.join() === out.metaGap.frame.join());
    v.layoutTriggerFrames();
    await sleep(900);

    // Fallback 3: no ratio at all (a feed that never handed back metadata) must not draw a stray box.
    const savedRatio = v.feedRatio ? v.feedRatio.front : null;
    if (v.feedRatio) delete v.feedRatio.front;
    const noNat = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'videoWidth');
    try {
        Object.defineProperty(video, 'videoWidth', { configurable: true, get: () => 0 });
        v.layoutTriggerFrames();
        await sleep(900);
        out.noRatio = { props: ['--trigger-left', '--trigger-top', '--trigger-width', '--trigger-height']
            .map((n) => cell.style.getPropertyValue(n) || '-').join('/'), row: (check()[0] || null) };
    } finally {
        try { delete video.videoWidth; } catch (e) { /* shadow */ }
        void noNat;
        if (savedRatio && v.feedRatio) v.feedRatio.front = savedRatio;
    }
    v.layoutTriggerFrames();
    await sleep(900);

    window.__r83verify = out;
    return JSON.stringify(out);
})()

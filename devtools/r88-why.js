(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    if (!ev) return JSON.stringify({ fatal: 'no fixture' });
    await v.playEvent(ev.eventId);
    await sleep(2500);
    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 8;
    v.peSelection.cameras = ['front', 'back'];
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    const report = () => {
        const rows = v.peSelection.cameras.map((camera) => {
            const target = v.peFrameTarget(camera, 0.25);
            if (!target) return { camera, target: null };
            const url = FrameFetcher.peek(target.path, target.seconds, PHONE_EXPORT_FRAME_W);
            const isImage = v.peFrameIsImage(url);
            const img = isImage ? v.peFrameImage(url) : null;
            return { camera, seconds: +target.seconds.toFixed(2), hasUrl: !!url, len: url ? url.length : 0,
                isImage, complete: img ? img.complete : null, nw: img ? img.naturalWidth : null };
        });
        return { rows, cap: v.peDom.previewCap.textContent, live: FrameFetcher.live,
            queued: FrameFetcher.waiting.length, cache: FrameFetcher.cache.size,
            previewOn: v.pePreviewOn, seq: v.pePreviewSeq };
    };
    const out = { t0: report() };
    await sleep(4000);
    out.t4 = report();
    // Force one more pass and see what it reports as missing.
    v.drawPhoneExportPreview(v.phoneExportPlan(), false, 0.25);
    await sleep(1500);
    out.after = report();
    return JSON.stringify(out, null, 1);
})()

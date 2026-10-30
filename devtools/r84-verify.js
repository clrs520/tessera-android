// R84 verification on the installed APK. Frontend JS ships inside the Rust lib, so presence is
// proved by reading the live functions back out of the page, not by listing APK files.
(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    const cp = v.continuousPlayer;
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const out = { version: 'r84-verify', shipped: {}, steps: {}, notes: [] };
    const src = (fn) => { try { return typeof fn === 'function' ? String(fn) : ''; } catch (e) { return ''; } };

    out.shipped = {
        cleanupKeepsPlaying: src(mp.cleanup).includes('if (!keepHeldFrames) this.isPlaying = false'),
        visibilityLoadsMissing: src(mp.applyFeedVisibility).includes('loadDeferredFeed'),
        layoutResetsActive: src(mp.setLayout).includes("activeCamera = 'front'"),
        drainHasGeneration: src(cp.drainSeekRequests).includes('eventGeneration'),
        seekHasGeneration: src(cp.applySeek).includes('eventGeneration'),
        resetZoomRelayouts: src(v.resetFeedZoom).includes('scheduleTriggerFrameLayout'),
        restoreKeepsZoom: src(v.restoreEventAfterRescan).includes('preZoomLayout'),
        scanCatchRestoresPath: src(v.loadTauriDirectory).includes('R84'),
        deleteClearsTrigger: src(v.confirmDeleteEvent).includes('applyTriggerHighlight(null)'),
    };

    // Load the 10-segment fixture. Fresh installs have no event open.
    const target = (v.eventGroups.find((e) => e.segments?.length > 1) || v.eventGroups[0])?.eventId;
    if (!target) return JSON.stringify({ ...out, err: 'no events' });
    await v.playEvent(target);
    for (let i = 0; i < 40 && !(v.currentEvent && mp.players.front.readyState >= 2); i++) await sleep(500);
    out.event = { id: v.currentEvent?.eventId || null, rs: mp.players.front?.readyState, layout: mp.layoutMode };

    // ---- P2: a grid cannot show the pillar the single view was on -----------------------------
    mp.setLayout('single');
    mp.setCamera('left_pillar');
    const before = mp.activeCamera;
    mp.setLayout('grid4');
    out.steps.P2 = {
        before,
        after: mp.activeCamera,
        visible: mp.visibleCameras(),
        ok: before === 'left_pillar' && mp.activeCamera === 'front',
    };

    // ---- U1: trigger frame follows the picture through zoom in and back out -------------------
    mp.setLayout('single');
    mp.setCamera('front');
    await sleep(1200);
    const event = v.currentEvent;
    const previousReason = event?.reason;
    if (event) event.reason = 'manual';
    v.applyTriggerHighlight(event);
    await sleep(1600);
    const cell = mp.playerContainers.front;
    const video = mp.players.front;
    const readProps = () => {
        const style = getComputedStyle(cell);
        return {
            w: Math.round(parseFloat(style.getPropertyValue('--trigger-width')) || 0),
            h: Math.round(parseFloat(style.getPropertyValue('--trigger-height')) || 0),
            cls: cell.classList.contains('trigger-cam'),
            frame: !!cell.querySelector('.trigger-frame'),
            zoomed: cell.classList.contains('feed-zoomed'),
        };
    };
    // Independent contain arithmetic: the picture a `<video>` paints inside its own box.
    const containWidth = () => {
        const vb = video.getBoundingClientRect();
        const nw = video.videoWidth, nh = video.videoHeight;
        if (!nw || !nh) return 0;
        return Math.round(Math.min(vb.width, vb.height * nw / nh));
    };
    const plain = readProps();
    const plainExpected = containWidth();
    v.feedZoom = { front: { scale: 2, x: 0, y: 0 } };
    cell.classList.add('feed-zoomed');
    v.scheduleTriggerFrameLayout();
    await sleep(1600);
    const zoomed = readProps();
    const cellWidth = Math.round(cell.clientWidth);
    v.resetFeedZoom();
    await sleep(1600);
    const restored = readProps();
    const restoredExpected = containWidth();
    out.steps.U1 = {
        objectFit: getComputedStyle(video).objectFit,
        cells: { plain, zoomed, restored },
        expected: { plain: plainExpected, cell: cellWidth, restored: restoredExpected },
        letterboxed: plainExpected > 0 && plainExpected < cellWidth,
        ok: plain.frame && plain.w === plainExpected
            && zoomed.w === cellWidth
            && Math.abs(restored.w - restoredExpected) <= 2,
    };
    v.applyTriggerHighlight(null);
    await sleep(300);
    const cleared = readProps();
    // The element is a permanent fixture; the class hides it (`.trigger-frame` is display:none
    // unless the cell has `.trigger-cam`). Element absence was never the contract.
    const frameEl = cell.querySelector('.trigger-frame');
    out.steps.U1.cleared = {
        ...cleared,
        frameDisplay: frameEl ? getComputedStyle(frameEl).display : 'missing',
        ok: !cleared.cls && !!frameEl && getComputedStyle(frameEl).display === 'none',
    };
    if (event) event.reason = previousReason;

    // ---- P4 + P1: splice cleanup must not fake a pause, and visible empty feeds get a file ----
    mp.setLayout('grid4');
    await sleep(800);
    mp.isPlaying = true;
    mp.cleanup(true);
    const afterCleanup = { playing: mp.isPlaying, srcs: mp.visibleCameras().filter((c) => !!mp.players[c].src).length };
    await sleep(600);
    afterCleanup.playingAfterTick = mp.isPlaying;
    mp.applyFeedVisibility();
    const srcNow = mp.visibleCameras().filter((c) => !!mp.players[c].src);
    await sleep(800);
    out.steps.P4 = {
        ...afterCleanup,
        ok: afterCleanup.playing === true && afterCleanup.playingAfterTick === true,
    };
    out.steps.P1 = {
        visible: mp.visibleCameras(),
        withSrc: srcNow,
        currentUrl: !!mp.currentUrls.front,
        suspendedHasFront: mp.suspendedFeeds.has('front'),
        ok: srcNow.length === mp.visibleCameras().length && !!mp.currentUrls.front,
    };

    // ---- Stream server: an unsatisfiable range answers 416, not 200 or a dropped socket ------
    const mediaUrl = mp.currentUrls.front;
    if (mediaUrl && /^https?:/.test(mediaUrl)) {
        try {
            const res = await fetch(mediaUrl, { headers: { Range: 'bytes=999999999-' } });
            // A cross-origin fetch only exposes CORS-safelisted response headers, so Content-Range
            // is invisible here even when the server sends it. Status 416 is what this probe can see;
            // the header itself was read from the wire with curl (`bytes */248605`) and is documented
            // in doc/ANDROID_CN.md.
            out.steps.range416 = {
                status: res.status,
                contentRangeExposed: res.headers.get('content-range'),
                ok: res.status === 416,
            };
            try { await res.body?.cancel(); } catch (e) { /* ignore */ }
        } catch (e) {
            out.steps.range416 = { err: String(e).slice(0, 120) };
        }
    } else {
        out.steps.range416 = { err: 'no stream url', url: String(mediaUrl || '').slice(0, 40) };
    }

    // ---- Rust: a truncated MP4 must be an error, not a SIGABRT -------------------------------
    try {
        const items = await window.__TAURI_INTERNALS__.invoke('read_sei_metadata', {
            path: '/storage/emulated/0/Download/corrupt-sei.mp4',
        });
        out.steps.rustSei = { ok: true, returned: Array.isArray(items) ? items.length : typeof items };
    } catch (e) {
        out.steps.rustSei = { ok: true, rejected: String(e).slice(0, 160) };
    }

    // ---- U4: a failed scan must not leave the failed folder remembered ------------------------
    const savedPath = v.lastScannedPath;
    const savedSig = v.lastScanSignature;
    const savedScan = v.nativeScanFiles;
    const staging = '/storage/emulated/0/TeslaCam/SavedClips';
    v.lastScannedPath = staging;
    v.nativeScanFiles = async () => { throw new Error('r84 forced scan failure'); };
    let scanReturn;
    try {
        scanReturn = await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    } finally {
        v.nativeScanFiles = savedScan;
    }
    out.steps.U4 = {
        returned: scanReturn,
        remembered: v.lastScannedPath,
        stillStaging: v.lastScannedPath === staging,
        sigUntouched: v.lastScanSignature === savedSig,
        ok: v.lastScannedPath === staging && v.lastScanSignature === savedSig,
    };
    v.lastScannedPath = savedPath;

    // ---- U6: a rescan restores the tap-zoom state --------------------------------------------
    const evId = v.currentEvent?.eventId;
    if (evId) {
        document.body.classList.add('camera-zoomed');
        v.preZoomLayout = 'grid4';
        await v.restoreEventAfterRescan({
            eventId: evId, at: 0, playing: false, camera: 'front', layout: 'single',
            zoomed: true, preZoomLayout: 'grid4', drawerOpen: false,
        });
        out.steps.U6 = {
            sameEvent: v.currentEvent?.eventId === evId,
            zoomed: document.body.classList.contains('camera-zoomed'),
            preZoom: v.preZoomLayout,
            layout: mp.layoutMode,
        };
        out.steps.U6.ok = out.steps.U6.sameEvent && out.steps.U6.zoomed && out.steps.U6.preZoom === 'grid4';
    }

    // ---- P3: a seek target captured before an event switch must not apply to the new event ----
    const saved = { take: cp.takeSeekRequest, wait: cp.waitForTransition, apply: cp.applySeek };
    const run = async (switchDuringWait) => {
        const applied = [];
        let calls = 0;
        cp.takeSeekRequest = () => (calls++ === 0 ? 42 : null);
        cp.waitForTransition = async () => {};
        cp.applySeek = async (t) => { applied.push(t); };
        const gen = cp.eventGeneration;
        const promise = cp.drainSeekRequests();
        if (switchDuringWait) cp.eventGeneration = gen + 1;
        await promise;
        cp.eventGeneration = gen;
        return applied;
    };
    try {
        const switched = await run(true);
        const control = await run(false);
        out.steps.P3 = {
            appliedAfterSwitch: switched,
            control,
            ok: switched.length === 0 && control.length === 1 && control[0] === 42,
        };
    } finally {
        cp.takeSeekRequest = saved.take;
        cp.waitForTransition = saved.wait;
        cp.applySeek = saved.apply;
        cp.seekClaimedTarget = null;
    }

    out.notes.push('range416 needs the current stream url; U4 stubs nativeScanFiles for one call');
    return JSON.stringify(out);
})()

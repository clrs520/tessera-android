// R86 orientation census. One clip whose rotation lives only in the container's transform, read
// through every path that can produce a picture, so a disagreement between them is the bug and an
// agreement is the proof. Dims only — the loopback URL carries the file-read token and never leaves
// the page.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { stamp: '2026-10-17_11-30-00', steps: {} };
    const orient = (w, h) => (w > h ? 'landscape' : w < h ? 'portrait' : 'square');

    // ---- 1. the scan sees the new event, and the list card paints the rotated clip ----------
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    const event = (v.eventGroups || []).find((e) => String(e.eventId || '').includes(out.stamp));
    out.steps.scan = {
        found: !!event,
        eventId: event && (event.eventId || event.fileName),
        frontPath: event && event.segments?.[0]?.files?.front,
    };
    if (!event) return JSON.stringify(out, null, 1);

    const card = [...document.querySelectorAll('.video-card, .event-card, [data-event-id]')]
        .find((el) => (el.dataset?.eventId || '').includes(out.stamp) || el.textContent?.includes('11:30'));
    const cardImg = card && card.querySelector('img');
    if (cardImg) {
        await new Promise((resolve) => {
            if (cardImg.complete) return resolve();
            cardImg.onload = cardImg.onerror = resolve;
            setTimeout(resolve, 12000);
        });
    }
    out.steps.card = cardImg ? {
        nat: [cardImg.naturalWidth, cardImg.naturalHeight],
        orientation: orient(cardImg.naturalWidth, cardImg.naturalHeight),
        rendered: [Math.round(cardImg.getBoundingClientRect().width), Math.round(cardImg.getBoundingClientRect().height)],
        objectFit: getComputedStyle(cardImg).objectFit,
    } : { missing: 'no img painted on the card' };

    // ---- 2. the native retriever, asked directly for the same clip ---------------------------
    const nativeDims = (path, millis) => new Promise((resolve) => {
        const id = `r86c${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got !== id || resolve.done) return;
            resolve.done = true;
            if (typeof dataUrl !== 'string') return resolve(null);
            const image = new Image();
            image.onload = () => resolve({ nat: [image.naturalWidth, image.naturalHeight] });
            image.onerror = () => resolve('decode-error');
            image.src = dataUrl;
        };
        setTimeout(() => { resolve.done = true; resolve('timeout'); }, 20000);
        window.TDashcamNative.requestThumb(id, path, millis, 160);
    });
    const front = out.steps.scan.frontPath;
    const nativeAnswer = front ? await nativeDims(front, 1000) : null;
    out.steps.nativeThumb = nativeAnswer && nativeAnswer.nat ? {
        nat: nativeAnswer.nat, orientation: orient(...nativeAnswer.nat),
    } : { raw: nativeAnswer };

    // ---- 3. what the platform's own decoder thinks the picture is ----------------------------
    // The player renders through the WebView, so its `videoWidth/Height` is the reference answer
    // for "upright or not" on this device.
    card?.click();
    for (let i = 0; i < 40 && !(v.multiCameraPlayer?.players?.front?.videoWidth); i += 1) await sleep(500);
    const feed = v.multiCameraPlayer?.players?.front;
    const cell = document.getElementById('front')?.getBoundingClientRect?.();
    out.steps.player = feed ? {
        video: [feed.videoWidth, feed.videoHeight],
        orientation: orient(feed.videoWidth, feed.videoHeight),
        cell: cell ? [Math.round(cell.width), Math.round(cell.height)] : null,
        objectFit: getComputedStyle(feed).objectFit,
        paused: feed.paused,
    } : { missing: 'front feed never reported size' };

    // ---- 4. the page-side fallback grab, same clip, same width ------------------------------
    // `grabViaVideo` sizes its canvas from `videoWidth/Height`, so this says whether the fallback
    // and the native retriever hand the list the same shape.
    const template = feed?.currentSrc || document.querySelector('video[src*="/media/"]')?.src;
    if (template) {
        const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const tail = template.split('/media/')[1];
        const token = tail.split('/')[0];
        const url = template.replace(`/media/${tail}`, `/media/${token}/${b64(front)}`);
        const probe = document.createElement('video');
        probe.muted = true;
        probe.src = url;
        const ok = await new Promise((resolve) => {
            probe.onloadeddata = () => resolve(true);
            probe.onerror = () => resolve(false);
            setTimeout(() => resolve('waited-out'), 20000);
            probe.load();
        });
        if (ok === true) {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = Math.max(1, Math.round(160 * probe.videoHeight / probe.videoWidth));
            canvas.getContext('2d').drawImage(probe, 0, 0, canvas.width, canvas.height);
            out.steps.canvasGrab = {
                video: [probe.videoWidth, probe.videoHeight],
                canvas: [canvas.width, canvas.height],
                orientation: orient(canvas.width, canvas.height),
            };
        } else out.steps.canvasGrab = { failed: String(ok) };
        probe.removeAttribute('src');
        try { probe.load(); } catch (e) { /* detached */ }
    } else out.steps.canvasGrab = { missing: 'no /media/ url to clone' };

    // ---- 5. do the three agree? ------------------------------------------------------------
    const shapes = {
        card: out.steps.card?.orientation,
        native: out.steps.nativeThumb?.orientation,
        player: out.steps.player?.orientation,
        canvas: out.steps.canvasGrab?.orientation,
    };
    const known = Object.values(shapes).filter(Boolean);
    out.steps.agreement = { shapes, allSame: new Set(known).size === 1, measured: known.length };

    window.__r86orient = out;
    return JSON.stringify(out, null, 1);
})()

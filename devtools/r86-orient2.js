// R86 orientation census, second pass: same clip read through the four paths that can put a
// picture on screen, with the loaded event and the feed identity asserted rather than assumed.
// Dims and booleans only — the loopback URL carries the file-read token and never leaves the page.
(async () => {
    const v = window.viewer;
    const mcp = v.multiCameraPlayer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const STAMP = '2026-10-17_11-30-00';
    const out = { stamp: STAMP, steps: {} };
    const orient = (w, h) => (w > h ? 'landscape' : w < h ? 'portrait' : 'square');
    const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const pathOf = (f) => (typeof f === 'string' ? f : f?.path);

    const event = (v.eventGroups || []).find((e) => String(e.eventId || '').includes(STAMP));
    if (!event) return JSON.stringify({ error: 'event not scanned' }, null, 1);
    const frontPath = pathOf(event.segments?.[0]?.files?.front);
    out.steps.event = { eventId: event.eventId, frontPath, expectedB64: b64(frontPath).slice(0, 8) };

    // ---- 1. the list card, painted by the native retriever through the observer -------------
    const card = [...document.querySelectorAll('.video-card')].find((el) => el.dataset.eventId === event.eventId);
    out.steps.cardDom = { found: !!card, thumbHtmlHead: card ? (card.querySelector('.video-thumbnail')?.innerHTML || '').slice(0, 60) : null };
    if (card) {
        card.scrollIntoView({ block: 'center' });
        for (let i = 0; i < 40 && !card.querySelector('.video-thumbnail img'); i += 1) await sleep(500);
        const img = card.querySelector('.video-thumbnail img');
        if (img) {
            await new Promise((resolve) => {
                if (img.complete && img.naturalWidth) return resolve();
                img.onload = img.onerror = resolve;
                setTimeout(resolve, 15000);
            });
            out.steps.card = img.naturalWidth ? {
                nat: [img.naturalWidth, img.naturalHeight],
                orientation: orient(img.naturalWidth, img.naturalHeight),
                rendered: [Math.round(img.getBoundingClientRect().width), Math.round(img.getBoundingClientRect().height)],
                objectFit: getComputedStyle(img).objectFit,
            } : { broken: 'img present but zero natural size' };
        } else out.steps.card = { missing: 'observer never painted an img' };
    }

    // ---- 2. the player: the platform's own answer for "which way is this picture up" --------
    card?.click();
    for (let i = 0; i < 60 && !(mcp?.players?.front?.videoWidth); i += 1) await sleep(500);
    const feed = mcp?.players?.front;
    out.steps.player = {
        loadedEvent: v.currentEvent?.eventId,
        isRotatedEvent: v.currentEvent?.eventId === event.eventId,
        feedIsThisClip: !!feed?.currentSrc?.includes(b64(frontPath)),
        video: feed ? [feed.videoWidth, feed.videoHeight] : null,
        orientation: feed ? orient(feed.videoWidth, feed.videoHeight) : null,
        objectFit: feed ? getComputedStyle(feed).objectFit : null,
    };

    // ---- 3. the native retriever, asked directly for the same clip ---------------------------
    const nativeDims = (path, millis) => new Promise((resolve) => {
        const id = `r86n${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got !== id || done) return;
            done = true;
            if (typeof dataUrl !== 'string') return resolve(null);
            const image = new Image();
            image.onload = () => resolve([image.naturalWidth, image.naturalHeight]);
            image.onerror = () => resolve('decode-error');
            image.src = dataUrl;
        };
        setTimeout(() => { if (!done) { done = true; resolve('timeout'); } }, 20000);
        window.TDashcamNative.requestThumb(id, path, millis, 160);
    });
    const nativeAnswer = await nativeDims(frontPath, 1000);
    out.steps.nativeThumb = Array.isArray(nativeAnswer)
        ? { nat: nativeAnswer, orientation: orient(...nativeAnswer) }
        : { raw: nativeAnswer };

    // ---- 4. the page-side fallback grab (`grabViaVideo`) on the same clip --------------------
    // Its canvas is sized from `videoWidth/Height`, so if the reported size and the drawn picture
    // disagree about which axis is long, the fallback stretches a rotated clip.
    const url = feed?.currentSrc;
    if (url) {
        const tail = url.split('/media/')[1] || '';
        const token = tail.split('/')[0];
        const probe = document.createElement('video');
        probe.muted = true;
        probe.src = url.replace(`/media/${tail}`, `/media/${token}/${b64(frontPath)}`);
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
            // Sample a horizontal strip of the drawn picture: if the aspect the canvas was sized
            // with is wrong, the content is squashed, and the luma gradient across the middle row
            // shows it as a band that is far too flat to be the scene.
            const ctx = canvas.getContext('2d');
            const row = ctx.getImageData(0, Math.round(canvas.height / 2), canvas.width, 1).data;
            const distinct = new Set();
            for (let i = 0; i < row.length; i += 4) distinct.add(`${row[i] >> 4},${row[i + 1] >> 4},${row[i + 2] >> 4}`);
            out.steps.canvasGrab = {
                video: [probe.videoWidth, probe.videoHeight],
                canvas: [canvas.width, canvas.height],
                orientation: orient(canvas.width, canvas.height),
                aspectVsPlayer: +(canvas.width / canvas.height).toFixed(3),
                middleRowTones: distinct.size,
            };
        } else out.steps.canvasGrab = { failed: String(ok) };
        probe.removeAttribute('src');
        try { probe.load(); } catch (e) { /* detached */ }
    } else out.steps.canvasGrab = { missing: 'front feed has no src to clone' };

    // ---- 5. agreement -----------------------------------------------------------------------
    const shapes = {
        card: out.steps.card?.orientation,
        native: out.steps.nativeThumb?.orientation,
        player: out.steps.player?.orientation,
        canvas: out.steps.canvasGrab?.orientation,
    };
    const known = Object.entries(shapes).filter(([, value]) => value);
    out.steps.agreement = { shapes, distinct: [...new Set(known.map(([, value]) => value))], measured: known.length };

    window.__r86orient = out;
    return JSON.stringify(out, null, 1);
})()

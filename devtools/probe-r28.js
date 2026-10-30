(() => {
    const Q = (s) => document.querySelector(s);
    const geo = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
            w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top),
            b: Math.round(r.bottom), l: Math.round(r.left), rgt: Math.round(r.right),
            vis: cs.visibility, disp: cs.display, op: cs.opacity,
        };
    };
    const over = (a, b) => {
        if (!a || !b) return null;
        const x = Math.min(a.rgt, b.rgt) - Math.max(a.l, b.l);
        const y = Math.min(a.b, b.b) - Math.max(a.t, b.t);
        return x > 1 && y > 1 ? Math.round(x * y) : 0;
    };

    const out = {
        orient: matchMedia('(orientation: landscape)').matches ? 'land' : 'port',
        vp: [innerWidth, innerHeight],
        playing: !!Q('.video-card.playing'),
        cardCount: document.querySelectorAll('.video-card').length,
        versionRow: geo(Q('#appVersion')),
    };

    // R28-1: the reward poster is 1242x1692; a square box squashes it and a squashed code scans badly.
    const qr = Q('#aboutQrImg');
    const qrBtn = Q('#aboutQrBtn');
    if (qr) {
        const r = qr.getBoundingClientRect();
        out.r28qr = {
            natural: [qr.naturalWidth, qr.naturalHeight],
            box: [Math.round(r.width), Math.round(r.height)],
            shownRatio: +(r.width / r.height).toFixed(3),
            naturalRatio: qr.naturalHeight ? +(qr.naturalWidth / qr.naturalHeight).toFixed(3) : null,
            pressed: qrBtn ? qrBtn.getAttribute('aria-pressed') : null,
            alt: qr.alt,
            modal: !!Q('#aboutModal')?.classList.contains('show'),
        };
    }

    // R28-2: filesystem, capacity and read-only have to be readable off the chip itself.
    out.r28chips = [...document.querySelectorAll('.dir-volume-chip')].map((chip) => ({
        label: chip.textContent.replace(chip.querySelector('.dir-volume-meta')?.textContent || '', '').trim(),
        meta: chip.querySelector('.dir-volume-meta')?.textContent || '',
        badge: chip.querySelector('.dir-volume-badge')?.textContent || '',
        title: chip.title,
        disabled: chip.disabled,
        cls: chip.className.replace('dir-volume-chip ', ''),
    }));
    const warn = Q('#androidDirVolumeWarn');
    out.r28warn = warn && warn.style.display !== 'none' ? warn.textContent : '';

    // R28-3: paging instead of ten thousand rows.
    out.r28browser = {
        path: Q('#androidDirPathInput')?.value || '',
        rows: document.querySelectorAll('.dir-browser-item').length,
        more: Q('.dir-browser-more')?.textContent || '',
        count: Q('.dir-browser-count')?.textContent || '',
    };

    out.r28deleteAria = [...document.querySelectorAll('#headerActionsGroup .control-btn')]
        .map((b) => `${b.id}:${b.getAttribute('aria-label') || 'NONE'}`);

    // Round 27 items 3 / 6 / 9, still owed a real playback pass.
    const strip = Q('.clip-filmstrip');
    const meta = Q('.metadata-panel');
    const stats = Q('.stats-overlay');
    out.r27 = {
        fsBtn: geo(Q('#fullscreenBtn')),
        filmstrip: geo(strip),
        metadata: geo(meta),
        stats: geo(stats),
        overMeta: over(strip, meta),
        overStats: over(strip, stats),
        stripRatio: strip ? +(strip.getBoundingClientRect().width / strip.getBoundingClientRect().height).toFixed(3) : null,
        aspectSource: window.viewer?.clipFrameAspect ? +window.viewer.clipFrameAspect.toFixed(3) : null,
        aspectFor: window.viewer?.clipFrameAspectFor || null,
    };

    const modal = Q('#phoneExportModal');
    if (modal && modal.classList.contains('show')) {
        const video = Q('#mainPlayer') || Q('video');
        out.r27item6 = {
            tiles: [...document.querySelectorAll('.pe-tile')].map((t) => {
                const r = t.getBoundingClientRect();
                return { n: t.dataset.index, w: Math.round(r.width), h: Math.round(r.height), ratio: +(r.width / r.height).toFixed(3) };
            }),
            plate: geo(Q('.pe-plate') || Q('.pe-plate')),
            videoRatio: video ? +(video.videoWidth / video.videoHeight).toFixed(3) : null,
            rects: window.tdViewer?.peRects ?? null,
        };
    }
    return JSON.stringify(out, null, 1);
})()

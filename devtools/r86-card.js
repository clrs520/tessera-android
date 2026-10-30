// R86 card evidence. The list lives in a collapsed drawer on the phone home screen, so its boxes
// never intersect and no frame is ever asked for — the probe has to open the drawer the way a tap
// does before the observer paints anything.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const STAMP = '2026-10-17_11-30-00';
    const orient = (w, h) => (w > h ? 'landscape' : w < h ? 'portrait' : 'square');
    const out = { steps: {} };

    v.toggleSidebar(true);
    await sleep(1500);
    out.steps.drawer = { cls: v.dom.sidebar.className };

    const card = [...document.querySelectorAll('.video-card')]
        .find((el) => (el.dataset.eventId || '').includes(STAMP));
    const control = [...document.querySelectorAll('.video-card')]
        .find((el) => !(el.dataset.eventId || '').includes(STAMP));
    const boxOf = (el) => el?.querySelector('.video-thumbnail');

    for (const el of [card, control]) {
        const box = boxOf(el);
        if (!box) continue;
        box.scrollIntoView({ block: 'center' });
        for (let i = 0; i < 60 && !box.querySelector('img'); i += 1) await sleep(500);
        await sleep(800);
        const img = box.querySelector('img');
        el.__observed = {
            eventId: (el.dataset.eventId || '').slice(-24),
            nat: img ? [img.naturalWidth, img.naturalHeight] : null,
            orientation: img ? orient(img.naturalWidth, img.naturalHeight) : null,
            left: img ? Math.round(img.getBoundingClientRect().left) : null,
            top: img ? Math.round(img.getBoundingClientRect().top) : null,
            fit: img ? getComputedStyle(img).objectFit : null,
            stillWaiting: !img ? (box.dataset.framePath ? 'observed, never intersected' : 'never queued') : null,
        };
    }
    out.steps.rotatedCard = card?.__observed || { missing: 'no r86 card' };
    out.steps.controlCard = control?.__observed || { missing: 'no control card' };

    out.steps.verdict = {
        rotatedIsLandscape: out.steps.rotatedCard?.orientation === 'landscape',
        controlIsPortrait: out.steps.controlCard?.orientation === 'portrait',
        bothPainted: !!out.steps.rotatedCard?.nat && !!out.steps.controlCard?.nat,
    };
    window.__r86card = out;
    return JSON.stringify(out, null, 1);
})()

// R169 · the two reported failures, measured.
//
// A. Holes on the ruler must not be hit-testable. With 35 major holes on a 340 px bar the old
//    build answered `.gap-marker` for 170 of 171 points along the track — the tick *was* the track.
//    Here the same dense event must answer 0, while the ticks keep their aria-label and click path.
// B. A second tap on the card that is still loading must not restart the six-feed splice. The
//    old build ran two `loadEvent`s for one double tap; now it must run exactly one, and the row
//    must be marked active before the feeds finish.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const vc = v.videoControls;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

    // ---- A. dense holes on the ruler --------------------------------------------------------
    v.dom.playerArea.classList.remove('empty');
    vc.totalDuration = 600;
    const starts = [];
    const durs = [];
    const gaps = [];
    let t = 0;
    for (let i = 0; i < 40; i += 1) {
        starts.push(t);
        durs.push(10);
        gaps.push(i ? 6.5 : 0);
        t += 16.5;
    }
    vc.addGapMarkers({ segmentGaps: gaps, segmentStartTimes: starts, segmentDurations: durs });
    // The bar auto-hides after a few seconds; with the overlay down `elementFromPoint` answers the
    // player and every "no tick was hit" would be true for the wrong reason.
    vc.showControls();
    const bar = vc.progressContainer;
    const rect = bar.getBoundingClientRect();
    check('the ruler is actually on screen for the hit test',
        vc.overlay.classList.contains('show') && rect.height > 0,
        `overlay=${vc.overlay.classList.contains('show')} ${Math.round(rect.width)}x${Math.round(rect.height)}`);
    let gapHits = 0;
    let samples = 0;
    const hitClasses = {};
    for (let x = 2; x < rect.width; x += 2) {
        const node = document.elementFromPoint(rect.left + x, rect.top + rect.height / 2);
        samples += 1;
        const cls = node && node.className ? String(node.className) : (node ? node.tagName : 'none');
        hitClasses[cls] = (hitClasses[cls] || 0) + 1;
        if (node && node.closest && node.closest('.gap-marker')) gapHits += 1;
    }
    const majors = [...bar.querySelectorAll('.gap-marker:not(.minor)')];
    check('dense fixture really placed its holes', majors.length >= 30, `${majors.length} major ticks`);
    // R170 supersedes R169's "no tick may be hit": the tick is a target again, but it must not own
    // the gesture. A pointerdown dispatched on a tick has to arrive at the bar (bubbling), which is
    // what keeps a drag from being swallowed.
    const sampleTick = majors[Math.floor(majors.length / 2)];
    if (sampleTick) {
        const sb = sampleTick.getBoundingClientRect();
        sampleTick.dispatchEvent(new PointerEvent('pointerdown', {
            bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 88,
            clientX: sb.left + sb.width / 2, clientY: sb.top + sb.height / 2,
        }));
    }
    const handed = vc.isDragging === true && !!vc.scrubGapLabel;
    vc.isDragging = false;
    vc.scrubOrigin = null;
    vc.scrubGapLabel = null;
    check('a hole hands the gesture to the scrub bar', handed, `${gapHits}/${samples} points hit a tick`);

    // TalkBack talks to the button, not to a pointer: a programmatic click must still explain.
    let said = null;
    const hadOwn = Object.prototype.hasOwnProperty.call(v, 'showToast');
    const origToast = v.showToast;
    v.showToast = (text) => { said = text; };
    try { majors[majors.length - 1]?.click(); } catch (e) { /* recorded below */ }
    if (hadOwn) v.showToast = origToast; else delete v.showToast;
    check('a hole still explains itself to accessibility', typeof said === 'string' && said.length > 0,
        majors.length ? `${majors[majors.length - 1].getAttribute('aria-label')} / said=${said}` : 'no ticks');

    // ---- B. double tap on the card that is still loading ------------------------------------
    const loaded = await v.loadTauriDirectory('/sdcard/TeslaCamReg2');
    await sleep(600);
    const ids = v.eventGroups.map((e) => e.eventId);
    const cp = v.continuousPlayer;
    const ownLoad = Object.prototype.hasOwnProperty.call(cp, 'loadEvent');
    const origLoad = cp.loadEvent;
    let loads = 0;
    cp.loadEvent = async function (...args) {
        loads += 1;
        return origLoad.apply(this, args);
    };

    // mark active before the feeds finish, and coalesce a same-tick second tap: the first call has
    // already claimed the event synchronously, so the test cannot race a very fast load.
    const t0 = performance.now();
    const p1 = v.playEvent(ids[2]);
    const activeEarly = document.querySelector(`.video-card[data-event-id="${ids[2]}"]`)?.classList.contains('active');
    const p2 = v.playEvent(ids[2]);           // same card, load in flight
    await Promise.all([p1, p2]);
    const singleMs = Math.round(performance.now() - t0);
    const afterDouble = loads;
    check('a repeated tap does not restart the splice', afterDouble === 1, `${afterDouble} loadEvent call(s), ${singleMs} ms`);
    check('the tapped row is marked before the feeds finish', activeEarly === true, String(activeEarly));
    const doubleMs = singleMs;

    // a different card during a load still supersedes: the fling keeps last-one-wins
    loads = 0;
    const p3 = v.playEvent(ids[2]);
    await sleep(120);
    const p4 = v.playEvent(ids[1]);
    await Promise.all([p3, p4]);
    await sleep(150);
    check('a different card still wins immediately', v.currentEvent && v.currentEvent.eventId === ids[1],
        `${v.currentEvent && v.currentEvent.eventId} | loads=${loads}`);
    check('the superseded load did not swallow the newer one', loads === 2, `${loads} loadEvent call(s)`);

    if (ownLoad) cp.loadEvent = origLoad; else delete cp.loadEvent;

    // one clean single switch for the time baseline (the count above is the real evidence)
    const t1 = performance.now();
    await v.playEvent(ids[2]);
    const oneMs = Math.round(performance.now() - t1);
    check('the switch itself completes', v.currentEvent && v.currentEvent.eventId === ids[2], `${oneMs} ms`);

    // The emulator decodes at most ~4 AVD feeds at once; the reference feed is the one the clock
    // and auto-next depend on, so that is what has to be ready. A six-grid losing its last two is
    // the known AVD decoder ceiling, not a switch failure.
    const front = v.multiCameraPlayer.players.front;
    check('the reference feed is ready after the switch', !!front && front.src && front.readyState >= 2,
        `front rs=${front && front.readyState} layout=${v.multiCameraPlayer.layoutMode}`);

    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        gap: { samples, gapHits, majors: majors.length, hitClasses },
        switch: { singleMs: doubleMs, oneMs, afterDouble, loadsAfterFling: loads, loaded },
    });
})()

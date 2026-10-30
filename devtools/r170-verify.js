// R170 — a hole is a target again, without owning the gesture.
//   * its hit box may be hit (that is how a tap on it is recognised);
//   * a pointerdown on it must reach the scrub bar (it is not stopped at the tick);
//   * the box stays inside the 20 px bar, so it cannot steal touches from the player above;
//   * `sayGap` says the sentence once per gesture (finger release + synthetic click).
(async () => {
    const v = window.viewer;
    const vc = v.videoControls;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });

    if (!v.eventGroups.some((e) => e.eventId.includes('2026-10-09'))) {
        await v.loadTauriDirectory('/sdcard/TeslaCamReg2');
    }
    v.dom.playerArea.classList.remove('empty');
    v.multiCameraPlayer.pauseAll();
    const total = vc.totalDuration || v.continuousPlayer.getTotalDuration() || 60;
    vc.setTotalDuration(total);
    // dense holes: the case that used to wall off the bar
    const starts = [];
    const durs = [];
    const gaps = [];
    let t = 0;
    for (let i = 0; i < 40; i += 1) {
        starts.push(t);
        durs.push(total / 40);
        gaps.push(i ? Math.max(6, total / 40) : 0);
        t += total / 40;
    }
    vc.addGapMarkers({ segmentGaps: gaps, segmentStartTimes: starts, segmentDurations: durs });
    vc.showControls();
    vc.resetHideTimer();
    const bar = vc.progressContainer;
    const rect = bar.getBoundingClientRect();
    const majors = [...bar.querySelectorAll('.gap-marker:not(.minor)')];
    check('dense fixture really placed its holes', majors.length >= 20, `${majors.length} ticks`);

    const tick = majors[Math.floor(majors.length / 2)];
    const tb = tick.getBoundingClientRect();
    const hit = document.elementFromPoint(tb.left + tb.width / 2, tb.top + tb.height / 2);
    check('a tap on a hole lands on the hole', !!(hit && hit.closest && hit.closest('.gap-marker')), hit ? hit.className : 'none');
    const after = getComputedStyle(tick, '::after');
    check('the hit box stays inside the bar', /-2px/.test(after.top) && /-6px/.test(after.left),
        `inset=${after.top} ${after.right} ${after.bottom} ${after.left}`);

    // A real finger's pointerdown is dispatched at the tick and must bubble to the bar. The bar's
    // capture call may throw for a synthetic pointerId; `startDrag` has already run either way.
    const sawDown = [];
    const sniff = (e) => sawDown.push(e.pointerType);
    bar.addEventListener('pointerdown', sniff, true);
    tick.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true, cancelable: true, pointerType: 'touch', pointerId: 77,
        clientX: tb.left + tb.width / 2, clientY: tb.top + tb.height / 2,
    }));
    bar.removeEventListener('pointerdown', sniff, true);
    check('a pointerdown on a hole reaches the scrub bar', vc.isDragging === true && sawDown.includes('touch'),
        `dragging=${vc.isDragging} saw=${sawDown.join(',')} gap=${vc.scrubGapLabel || 'none'}`);
    vc.isDragging = false;
    vc.scrubOrigin = null;
    vc.scrubGapLabel = null;

    // One sentence per gesture, not two.
    const toasts = [];
    const hadOwn = Object.prototype.hasOwnProperty.call(v, 'showToast');
    const origToast = v.showToast;
    v.showToast = (text) => { toasts.push(String(text)); };
    const label = tick.getAttribute('aria-label');
    vc.sayGap(label);
    vc.sayGap(label);
    if (hadOwn) v.showToast = origToast; else delete v.showToast;
    check('the hole speaks once per gesture', toasts.length === 1, `${toasts.length} toast(s): ${toasts[0] || ''}`);

    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        holes: majors.length,
        bar: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
    });
})()

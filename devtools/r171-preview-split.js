// R171 hotfix — an event that straddles two streamed batches.
// The accumulator must keep `segments` as a Map; finalizing a display copy must not turn the
// live event's segments into an array, or the next batch dies on `.has` (real-device
// TypeError at script.js:15124).
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    // The accumulator's segments is a Map; a finalized display copy's is an array.
    const totalFiles = (event) => {
        if (!event || !event.segments) return 0;
        const segs = event.segments instanceof Map ? [...event.segments.values()] : event.segments;
        return segs.reduce((n, seg) => n + Object.keys(seg.files || {}).length, 0);
    };

    let chosen = null;
    let paths = [];
    for (const event of v.eventGroups || []) {
        for (const seg of event.segments || []) {
            const files = Object.values(seg.files || {});
            if (files.length >= 4 && files.every((f) => f.path)) {
                chosen = event;
                paths = files.slice(0, 4).map((f) => f.path);
                break;
            }
        }
        if (chosen) break;
    }
    if (!chosen) {
        return JSON.stringify({ pass: 0, fail: 0, skipped: 'no event with 4 addressable files' });
    }

    // Build a fresh preview accumulator for the same root. `allFiles` and the finalized list are
    // not touched; this exercises only the streamed path.
    if (v.scanPreview?.timer) clearTimeout(v.scanPreview.timer);
    const preview = v.startScanPreview(v.lastScannedPath);
    const sizes = paths.map(() => 4096);
    const durations = paths.map(() => 20);

    v.ingestScanBatch({ files: paths.slice(0, 2), sizes: sizes.slice(0, 2), durations: durations.slice(0, 2) });
    v.renderScanPreview();
    const live1 = preview.map.get(chosen.eventId);
    const view1 = preview.view.get(chosen.eventId);
    const listed1 = (v.eventGroups || []).find((e) => e.eventId === chosen.eventId);
    check('first half: accumulator segments stay a Map',
        live1 && live1.segments instanceof Map, live1 ? String(live1.segments?.constructor?.name) : 'no live event');
    check('first half: display copy is finalized to an array',
        view1 && Array.isArray(view1.segments), view1 ? String(view1.segments?.constructor?.name) : 'no view event');
    check('first half: eventGroups does not alias the accumulator',
        listed1 && listed1 !== live1 && Array.isArray(listed1.segments),
        `listed=${listed1 ? String(listed1.segments?.constructor?.name) : 'missing'}`);
    check('first half: two files are visible', totalFiles(view1) === 2, `${totalFiles(view1)}`);

    // The old code had already turned the live event's segments into an array here, so this call
    // threw `event.segments.has is not a function`. It must now merge into the same Map.
    let crashed = null;
    try {
        v.ingestScanBatch({ files: paths.slice(2), sizes: sizes.slice(2), durations: durations.slice(2) });
    } catch (e) {
        crashed = e && e.message;
    }
    v.renderScanPreview();
    const live2 = preview.map.get(chosen.eventId);
    const view2 = preview.view.get(chosen.eventId);
    check('second half: ingest does not throw .has', !crashed, crashed || 'ok');
    check('second half: accumulator is still a Map with all four files',
        live2 && live2.segments instanceof Map && totalFiles(live2) === 4,
        `type=${live2 ? String(live2.segments?.constructor?.name) : 'missing'} files=${totalFiles(live2)}`);
    check('second half: view copy contains both halves',
        totalFiles(view2) === 4, `${totalFiles(view2)} files`);
    check('second half: view copy is still one segment (same minute)',
        view2 && view2.segments.length === 1, `${view2 ? view2.segments.length : '-'}`);

    // Drop the synthetic preview and let the normal list come back.
    if (preview.timer) clearTimeout(preview.timer);
    v.scanPreview = null;
    await v.loadTauriDirectory(v.lastScannedPath);

    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        event: chosen.eventId,
    });
})()

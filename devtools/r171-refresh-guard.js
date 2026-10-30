// R171 hotfix — the "same folder, same signature" shortcut may only skip a finished list.
// A streamed preview is a partial list of the same folder; skipping the rebuild there left
// only the events the preview had reached (seen as 381/505 in the emulator after a re-import).
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const full = (v.eventGroups || []).length;
    if (full < 2) return JSON.stringify({ pass: 0, fail: 0, skipped: `only ${full} events` });
    const path = v.lastScannedPath;

    // Pretend the screen holds a preview snapshot of this folder and the finished signature is
    // already known. The old shortcut matched the signature and kept the partial list.
    v.lastScanSignature = { path, sig: scanSignature(v.allFiles) };
    v.eventGroups = v.eventGroups.slice(0, 1);
    v.listIsPreview = true;
    await v.loadTauriDirectory(path);
    check('a preview list is rebuilt instead of skipped as unchanged',
        v.eventGroups.length === full && v.listIsPreview === false,
        `${v.eventGroups.length}/${full} preview=${v.listIsPreview}`);

    // The same call on a finished, unchanged list must still take the cheap path.
    let rebuilt = 0;
    const original = v.processFiles;
    v.processFiles = function patched(...args) { rebuilt += 1; return original.apply(this, args); };
    try {
        await v.loadTauriDirectory(path);
    } finally {
        v.processFiles = original;
    }
    check('a finished unchanged list still takes the shortcut', rebuilt === 0
        && v.eventGroups.length === full && v.listIsPreview === false,
        `processFiles=${rebuilt} events=${v.eventGroups.length}/${full}`);

    return JSON.stringify({
        pass: checks.filter((c) => c.ok).length,
        fail: checks.filter((c) => !c.ok).length,
        failures: checks.filter((c) => !c.ok),
        events: full,
    });
})()

// R191 — the second scan of the same folder should come from the stat index, not 62k `metadata()` calls.
(async () => {
    const v = window.viewer;
    const path = '/sdcard/TeslaCamBig';

    const scan = async () => {
        const t0 = performance.now();
        await v.loadTauriDirectory(path);
        const ms = Math.round(performance.now() - t0);
        const s = v.lastScanStats || {};
        return {
            ms,
            files: s.files,
            statMs: s.statMs,
            skipped: s.statSkipped,
            events: v.eventGroups.length,
            sizes: v.allFiles.slice(0, 4).map((f) => f.size),
            bytes: v.allFiles.reduce((n, f) => n + (f.size || 0), 0),
        };
    };

    const first = await scan();
    const second = await scan();
    return JSON.stringify({ first, second,
        skippedAll: second.skipped === second.files,
        sizesSame: JSON.stringify(first.sizes) === JSON.stringify(second.sizes),
        bytesSame: first.bytes === second.bytes,
    });
})()

(async () => {
    const v = window.viewer;
    const out = { listIsPreview: v.listIsPreview, sig: v.lastScanSignature ? { path: v.lastScanSignature.path, same: v.lastScanSignature.path === v.lastScannedPath } : null, events: v.eventGroups.length };
    // Ask the same question a pull-to-refresh asks, without paying for a second walk:
    // would the unchanged shortcut fire right now?
    const files = v.allFiles || [];
    const scanSignature = window.scanSignature || null;
    out.signatureFn = typeof scanSignature === 'function';
    out.wouldFire = !!(out.signatureFn && v.lastScanSignature && !v.listIsPreview && v.eventGroups.length
        && v.lastScanSignature.path === v.lastScannedPath
        && v.lastScanSignature.sig === scanSignature(files));
    out.files = files.length;
    return JSON.stringify(out);
})()

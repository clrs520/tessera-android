// R26 verification, part B: runtime state + the classes that own the new methods.
(() => {
    const lc = viewer.videoListComponent;
    const names = ['queueFrameThumb', 'ensureThumbObserver', 'firstClipPath', 'applyFrameThumb'];
    const ctrl = viewer.multiCameraPlayer?.controls;
    const r = {};
    r.listMethods = lc ? names.map(n => `${n}:${typeof lc[n] === 'function' ? 'fn' : (n in lc ? 'yes' : 'NO')}`).join(',') : 'no list comp';
    r.listObserver = lc ? (lc.thumbObserver ? 'created' : 'not-yet') : null;
    r.controls = viewer.videoControls ? ['buildClipFilmstrip', 'clipFrameTarget', 'hideClipFilmstrip']
        .map(n => `${n}:${typeof viewer.videoControls[n] === 'function' ? 'fn' : 'NO'}`).join(',') : 'no controls obj';
    r.allFiles = viewer.allFiles ? viewer.allFiles.length : null;
    r.eventGroups = viewer.eventGroups ? viewer.eventGroups.length : null;
    r.eventIds = (viewer.eventGroups || []).slice(0, 8).map(e => e.eventId);
    r.firstEvent = (() => {
        const e = (viewer.eventGroups || [])[0];
        if (!e) return null;
        const f = e.segments[0].files;
        return { thumb: !!e.thumbFile, keys: Object.keys(f), path: (f.front || Object.values(f)[0]).path };
    })();
    r.cacheSize = FrameFetcher.cache.size;
    r.cacheSample = [...FrameFetcher.cache.entries()].slice(0, 3).map(([k, v]) => `${k.slice(-44)}=${v === null ? 'NULL' : 'url:' + v.length}`);
    r.live = FrameFetcher.live;
    r.waiting = FrameFetcher.waiting.length;
    r.sampleUrl = (() => {
        const f = (viewer.allFiles || [])[0];
        return f && typeof getFileUrl === 'function' ? String(getFileUrl(f)).slice(0, 90) : null;
    })();
    r.uiError = document.getElementById('jsErrorBanner')?.textContent?.slice(0, 200) || null;
    return JSON.stringify(r, null, 1);
})()

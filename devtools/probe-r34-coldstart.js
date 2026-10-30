/* Cold-start truth check: does the About page read the *running* APK's version, or the
   localStorage cache written by the previous install? Run right after `am start`, no focus change.
   Also reports which storage chips got a TeslaCam badge (the phone's own volume included). */
(function () {
    function rect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    }
    const facts = {};
    document.querySelectorAll('#aboutModal .about-fact').forEach(function (el) {
        facts[(el.querySelector('dt') || {}).textContent] = (el.querySelector('dd') || {}).textContent;
    });
    const chips = [].slice.call(document.querySelectorAll('.dir-volume-chip')).map(function (c) {
        return {
            label: c.textContent.trim(),
            kind: (c.className.match(/kind-[a-z]+/) || ['-'])[0],
            path: c.dataset.path,
            badge: (c.querySelector('.dir-volume-badge') || {}).textContent || null,
            state: c.classList.contains('has-clips') ? 'clips' : c.classList.contains('is-empty') ? 'empty' : c.classList.contains('no-access') ? 'no-access' : '-'
        };
    });
    const about = document.getElementById('aboutModal');
    const panel = document.querySelector('#aboutModal .about-panel');
    return JSON.stringify({
        livePush: !!window.__tdashcamStorage,
        pulled: (function () {
            try { return JSON.parse(window.TDashcamNative.nativeStatus()); } catch (e) { return 'ERR:' + e.message; }
        })(),
        cached: (function () { try { return JSON.parse(localStorage.getItem('__tdashcam_storage')); } catch (e) { return null; } })(),
        resolved: (function () {
            const s = readNativeStorageStatus();
            return s ? { version: s.version, device: s.device, android: s.android, sdk: s.sdk } : null;
        })(),
        aboutShown: about ? getComputedStyle(about).display : 'none',
        facts: facts,
        panel: rect(panel),
        panelScroll: panel ? [panel.scrollHeight, panel.clientHeight] : null,
        contact: (document.getElementById('aboutFeedbackText') || {}).textContent || null,
        versionText: (document.getElementById('aboutVersion') || {}).textContent || null,
        versionRow: (document.getElementById('aboutVersionValue') || {}).textContent || null,
        chips: chips,
        warn: (document.getElementById('androidDirVolumeWarn') || {}).textContent || '',
        jsErrors: (window.__tdashcamErrors || []).length,
        smallTouch: [].slice.call(document.querySelectorAll('#aboutModal button, #aboutModal a')).filter(function (b) {
            const r = b.getBoundingClientRect();
            return r.width > 0 && (r.height < 40 || r.width < 40);
        }).map(function (b) { return b.className + rect(b).slice(2).join('x'); })
    }, null, 1);
})()

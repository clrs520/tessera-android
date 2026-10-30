(function () {
    var v = window.viewer;
    if (!v) return 'NO VIEWER';
    var de = document.documentElement;
    var bodyDark = document.body.classList.contains('dark-theme');
    var authoritative = v.resolveThemeDark ? v.resolveThemeDark() : 'no resolver';
    var paints = performance.getEntriesByType('paint').map(function (p) {
        return p.name + '=' + Math.round(p.startTime);
    });
    return JSON.stringify({
        mode: v.themeMode ? v.themeMode() : localStorage.getItem('tdashcam.themeMode'),
        bootTheme: de.dataset.bootTheme,
        inlineScheme: de.style.colorScheme,
        computedScheme: getComputedStyle(de).colorScheme,
        bodyDark: bodyDark,
        authoritative: authoritative,
        agree: typeof authoritative === 'boolean' ? authoritative === bodyDark : 'unknown',
        nativeNight: (function () {
            try {
                var s = JSON.parse(window.__tdashcamNativeStatus || 'null');
                return s ? s.night : 'no status';
            } catch (e) { return 'parse-fail'; }
        })(),
        matchMediaDark: matchMedia('(prefers-color-scheme: dark)').matches,
        paints: paints
    }, null, 1);
})();

(() => {
    const footer = document.querySelector('.sidebar-footer, .sidebar .version, #appVersion');
    const errs = (window.__tdashcamErrors || []).slice(-6);
    return JSON.stringify({
        url: location.href,
        ver: (document.body.textContent.match(/v1\.\d+\.\d+/) || [])[0] || null,
        footerText: footer ? footer.textContent.trim() : null,
        alertIsToast: /showToast/.test(String(window.alert)),
        errors: errs.length,
        lastErrors: errs,
        orientation: getComputedStyle(document.documentElement).getPropertyValue('--phone') || 'n/a',
        css: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
        vp: JSON.stringify(window.visualViewport && { w: visualViewport.width, h: visualViewport.height, s: visualViewport.scale }),
        remoteReqs: performance.getEntriesByType('resource').map(r => r.name).filter(n => /^https?:/.test(n) && !n.startsWith(location.origin)).slice(0, 8),
    }, null, 1);
})()

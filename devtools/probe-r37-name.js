/* R37 rename surface check: every place the app name is rendered, in the current language.
   Run once per language (viewer.setLanguage). */
(() => {
    const t = (sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent.trim().replace(/\s+/g, ' ') : null;
    };
    window.viewer.openAbout();
    return new Promise((resolve) => {
        setTimeout(() => {
            const out = {
                lang: window.viewer.currentLanguage,
                docTitle: document.title,
                brandSpan: t('.header-title span'),
                headerEvent: t('#headerEventName'),
                aboutTitle: t('#aboutModalTitle'),
                aboutTagline: t('#aboutTagline'),
                taglineVisible: (() => {
                    const el = document.querySelector('#aboutTagline');
                    return !!el && el.getBoundingClientRect().height > 0;
                })(),
                panel: (() => {
                    const p = document.querySelector('.about-panel');
                    return p ? [p.scrollHeight, p.clientHeight] : null;
                })(),
                viewport: `${Math.round(innerWidth)}x${Math.round(innerHeight)}`,
                jsError: window.__tdashcamLastError || null,
            };
            window.viewer.closeAbout && window.viewer.closeAbout();
            resolve(JSON.stringify(out, null, 1));
        }, 600);
    });
})()

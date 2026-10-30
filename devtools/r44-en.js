(() => {
    const before = (document.querySelector('#tapChoiceLabel')||{}).textContent;
    if (window.viewer && typeof window.viewer.setLanguage === 'function') window.viewer.setLanguage('en');
    const row = document.querySelector('#tapBehaviorChoice');
    const a = row ? row.querySelector('[aria-checked="true"]') : null;
    return JSON.stringify({
        zhLabel: before,
        hasSetLang: !!(window.viewer && window.viewer.setLanguage),
        enLabel: (document.querySelector('#tapChoiceLabel')||{}).textContent,
        enTitle: row ? row.getAttribute('title') : null,
        enActive: a ? a.textContent.trim() : null,
        enSegs: row ? [...row.querySelectorAll('.choice-segment')].map(b => b.textContent.trim()) : null,
        enThemeLabel: (document.querySelector('#themeChoiceLabel')||{}).textContent,
        lang: localStorage.getItem('tdashcam.lang')
    });
})()

(() => {
    if (window.viewer && window.viewer.setLanguage) window.viewer.setLanguage('zh');
    localStorage.setItem('tdashcam.themeMode', 'auto');
    if (window.viewer && window.viewer.applyThemeMode) window.viewer.applyThemeMode();
    else if (window.viewer && window.viewer.setThemeChoice) window.viewer.setThemeChoice('auto');
    return JSON.stringify({
        lang: localStorage.getItem('language'),
        tapLabel: (document.querySelector('#tapChoiceLabel')||{}).textContent,
        themeMode: localStorage.getItem('tdashcam.themeMode'),
        theme: localStorage.getItem('theme'),
        bodyBg: getComputedStyle(document.body).backgroundColor
    });
})()

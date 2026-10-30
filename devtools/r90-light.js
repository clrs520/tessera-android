// R90 throwaway setup: light theme + the export page on the 画面 pane, so the screenshot shows the
// B layout in the theme the real-device report came in. Reads no URL and no token.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!window.__r90keepTheme) window.__r90keepTheme = localStorage.getItem('tdashcam.themeMode');
    localStorage.setItem('tdashcam.themeMode', 'light');
    v.applyTheme(v.resolveThemeDark());
    await sleep(500);
    v.closePhoneExportZoom();
    await sleep(400);
    const m = document.getElementById('phoneExportModal');
    if (!m.classList.contains('show')) {
        await v.showPhoneExportModal();
        await sleep(900);
    }
    v.setPhoneExportPane('view');
    await sleep(600);
    return JSON.stringify({ dark: v.resolveThemeDark(), kept: window.__r90keepTheme,
        shown: m.classList.contains('show'), dock: Math.round(document.getElementById('pePreviewDock')
            .getBoundingClientRect().height) });
})()

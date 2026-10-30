// R80 — dump what 复制诊断 actually contains on this build, without touching the clipboard.
// Detached on purpose: `copyDiagnostics()` awaits the bridge, so a CDP probe that awaits it can time out
// while the work still finishes. Progress lands in `window.__r80dg`.
(() => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    window.__r80dg = { state: 'running' };
    const real = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
    const restore = () => { if (real) navigator.clipboard.writeText = real; };
    (async () => {
        try {
            if (navigator.clipboard) navigator.clipboard.writeText = t => { window.__r80dg.text = t; return Promise.resolve(); };
            await v.copyDiagnostics();
            const keep = (window.__r80dg.text || '').split('\n')
                .filter(l => /Tessera|特写|version|device=|syncGuard|holds|lost|axis|feeds/.test(l));
            window.__r80dg.state = 'done';
            window.__r80dg.keep = keep;
            window.__r80dg.versions = {
                dom: v.dom && v.dom.appVersion && v.dom.appVersion.textContent,
                native: (readNativeStorageStatus() || {}).version,
            };
        } catch (e) {
            window.__r80dg.state = 'error';
            window.__r80dg.err = String(e && e.message || e);
        } finally {
            restore();
        }
    })();
    return 'armed';
})();

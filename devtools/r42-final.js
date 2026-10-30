(() => {
    const rows = ['tapBehaviorChoice', 'themeChoice'].map(id => {
        const el = document.getElementById(id);
        if (!el) return { id, missing: true };
        const segs = [...el.querySelectorAll('[role=radio]')].map(s => ({
            mode: s.dataset.mode, checked: s.getAttribute('aria-checked'),
        }));
        return { id, segs };
    });
    const v = window.viewer;
    return JSON.stringify({
        rows,
        tapMode: v?.tapCardBehavior ?? localStorage.getItem('tdashcam.tapBehavior'),
        suspended: v?.multiCameraPlayer ? [...v.multiCameraPlayer.suspendedFeeds] : null,
        layout: v?.multiCameraPlayer?.layoutMode,
    });
})()

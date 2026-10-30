(() => {
    const v = window.viewer;
    if (!v) return 'NO VIEWER';
    const mcp = v.multiCameraPlayer;
    const players = mcp ? Object.fromEntries(Object.entries(mcp.players).map(([k, p]) =>
        [k, { src: p && p.src ? 'y' : '-', paused: p ? p.paused : null, t: p ? +p.currentTime.toFixed(2) : null }])) : null;
    const label = document.getElementById('aboutVersion');
    const cs = label ? getComputedStyle(label) : null;
    return JSON.stringify({
        version: label && label.textContent,
        versionFont: cs && cs.fontSize,
        versionWeight: cs && cs.fontWeight,
        versionColor: cs && cs.color,
        layoutMode: mcp && mcp.layoutMode,
        activeCamera: mcp && mcp.activeCamera,
        isPlaying: mcp && mcp.isPlaying,
        visible: mcp && mcp.visibleCameras(),
        suspended: mcp && Array.from(mcp.suspendedFeeds || []),
        players,
        labels: Array.from(document.querySelectorAll('.camera-label')).map(l => l.textContent + ':' + l.style.display),
        hasRenderLoop: typeof mcp.renderLoop === 'function',
        choices: {
            tap: !!document.getElementById('tapBehaviorChoice'),
            theme: !!document.getElementById('themeChoice'),
            tapVisible: (() => { const r = document.getElementById('tapBehaviorChoice'); return r ? getComputedStyle(r).display : null; })(),
            segs: Array.from(document.querySelectorAll('#tapBehaviorChoice .choice-segment')).map(s => s.textContent + ':' + s.dataset.mode + ':' + s.getAttribute('aria-checked')),
            themeSegs: Array.from(document.querySelectorAll('#themeChoice .choice-segment')).map(s => s.textContent + ':' + s.dataset.mode + ':' + s.getAttribute('aria-checked')),
        },
        storedTap: localStorage.getItem('tdashcam.tapBehavior'),
        theme: localStorage.getItem('tdashcam.themeMode'),
        events: (v.videoListComponent && (v.videoListComponent.listEvents || v.videoListComponent.events) || []).length,
        currentEvent: v.currentEvent && (v.currentEvent.id || v.currentEvent.name) || null,
        rafs: 'ok',
    }, null, 1);
})()

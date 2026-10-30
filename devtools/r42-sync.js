(() => {
    const mcp = window.viewer.multiCameraPlayer;
    const t = () => Object.fromEntries(Object.entries(mcp.players).map(([k, p]) => [k, +p.currentTime.toFixed(2)]));
    const first = t();
    return new Promise(resolve => {
        setTimeout(() => {
            const second = t();
            resolve(JSON.stringify({
                mode: mcp.layoutMode,
                active: mcp.activeCamera,
                suspended: Array.from(mcp.suspendedFeeds),
                first, second,
                advanced: Object.fromEntries(Object.entries(second).map(([k, v]) => [k, +(v - first[k]).toFixed(2)])),
                buffered: Object.fromEntries(Object.entries(mcp.players).map(([k, p]) => {
                    let end = 0;
                    try { for (let i = 0; i < p.buffered.length; i++) end = Math.max(end, p.buffered.end(i)); } catch (e) { /* noop */ }
                    return [k, +end.toFixed(2)];
                })),
                readyState: Object.fromEntries(Object.entries(mcp.players).map(([k, p]) => [k, p.readyState])),
                seiCache: window.viewer.metadataManager.constructor.seiCache.size,
            }));
        }, 3000);
    });
})()

(() => {
    const v = window.viewer;
    return JSON.stringify({
        ver: v?.appVersion || document.getElementById('appVersion')?.textContent,
        lang: v?.currentLanguage,
        events: v?.events?.length,
        current: v?.currentEvent?.id || v?.currentEvent?.name,
        graphSpan: v?.videoControls?.speedGraphSpan,
        graphCls: v?.videoControls?.speedGraphContainer?.className,
        vibSeen: (window.__vib || []).length,
    });
})()

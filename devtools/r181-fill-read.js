JSON.stringify(window.__probe ? { meta: [window.__probe.scrollTopAtRender, window.__probe.savedScroll],
    ticks: window.__probe.ticks } : { missing: true });

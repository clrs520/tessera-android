(async () => {
  const t = Date.now();
  while (Date.now() - t < 45000) {
    const v = window.viewer;
    if (v && v.eventGroups && v.eventGroups.length) {
      return JSON.stringify({ ms: Date.now() - t, groups: v.eventGroups.length, path: v.lastScannedPath });
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return JSON.stringify({ timeout: true, viewer: !!window.viewer, hasViewer: !!window.viewer });
})()

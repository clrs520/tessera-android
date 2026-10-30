(async () => {
  const t = window.__tauriInvoke || null;
  const call = (cmd, args) => new Promise(res => {
    const inv = (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) || null;
    if (!inv) return res({ noInvoke: true });
    inv(cmd, args).then(r => res(r), e => res({ err: String(e).slice(0, 160) }));
  });
  const p1 = await call('probe_readable', { path: '/storage/0000-0000/TeslaCam' });
  const p2 = await call('probe_readable', { path: '/storage/0000-0000' });
  const s1 = await call('list_subdirs', { path: '/storage' });
  const raw = window.TDashcamNative?.storageVolumes ? String(window.TDashcamNative.storageVolumes()) : null;
  return JSON.stringify({ probeTeslaCam: p1, probeMount: p2, storageListing: s1, frameworkVolumes: raw ? raw.slice(0, 400) : null }, null, 1);
})()

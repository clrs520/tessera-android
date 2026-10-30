(() => {
  const app = window.tdashcamApp || window.app;
  const ev = app?.currentEvent || app?.multiCameraPlayer?.currentEvent;
  return JSON.stringify({
    id: ev?.id, dir: ev?.directory || ev?.dir || null,
    segs: ev?.segments ? Object.fromEntries(Object.entries(ev.segments).map(([k,v])=>[k, (v[0]?.filePath||v[0]?.path||'').split('/').pop()])) : null,
  });
})()

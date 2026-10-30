// R147 判据（媒体服务）：只报状态码，不报 URL/令牌。
// 期望：真视频 200/206；非媒体扩展名 403；内核树 403；不存在的 mp4 404。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  if (typeof getStreamUrl !== 'function') return JSON.stringify({ fatal: 'getStreamUrl not on window' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v.eventGroups || !v.eventGroups.length) {
    await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
    for (let i = 0; i < 80 && !v.eventGroups.length; i++) await sleep(500);
  }
  const ev = v.eventGroups.find(e => (e.segments || []).length) || v.eventGroups[0];
  const files = (ev.segments?.[0]?.files) || {};
  const vid = files.front || Object.values(files)[0];
  const realPath = vid && vid.path;
  if (!realPath) return JSON.stringify({ fatal: 'no video path on the event', keys: Object.keys(ev) });

  const st = async (p) => {
    const url = getStreamUrl(p);
    if (!url) return 'no-url';
    try { const r = await fetch(url, { method: 'HEAD' }); return r.status; }
    catch (e) { return 'err:' + (e && e.name); }
  };

  const out = {
    realMp4: await st(realPath),
    // R152: an mp4 in Download is a real media file, but outside the folder the user scanned — the
    // server must refuse it, not serve it just because the extension is allowed.
    outsideRootMp4: await st('/storage/emulated/0/Download/Tessera_2026-10-23_14-40-00_0.0-0.3s_1c_720x1600.mp4'),
    xmlInMediaFolder: await st('/storage/emulated/0/TeslaCam/notes.xml'),
    systemBuildProp: await st('/system/build.prop'),
    procSelfMaps: await st('/proc/self/maps'),
    missingMp4: await st('/storage/emulated/0/TeslaCam/__nope__.mp4'),
  };
  return JSON.stringify(out);
})()

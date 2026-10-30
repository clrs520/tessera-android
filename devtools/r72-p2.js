// R72 speed-curve Phase 1: where does the per-segment cost actually go?
// Separates (a) file size, (b) whole-file fetch through the loopback media server,
// (c) the same fetch with warm HTTP cache, (d) a tiny Range request (per-request floor),
// (e) DashcamMP4.parseMetadata on the bytes we already have.
(async () => {
  const out = {};
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const ev = v.continuousPlayer.currentEvent;
  if (!ev) return JSON.stringify({ err: 'no event' });
  out.ev = ev.eventId; out.type = ev.eventType;

  const seg = ev.segments ? ev.segments[0] : null;
  const file = seg && seg.files && seg.files.front;
  if (!file) return JSON.stringify({ err: 'no front file', keys: seg ? Object.keys(seg.files) : null });
  out.file = file.name || (file.path || '').split('/').pop();
  const path = file.path || (typeof file.webkitRelativePath === 'string' ? file.webkitRelativePath : null);
  out.path = path;

  // (a) real size, straight off the filesystem
  try {
    const tauri = getTauri();
    const invoke = tauri && (tauri.core?.invoke || tauri.invoke);
    if (!invoke) out.invoke = 'missing';
    else {
      const md = tauri.fs?.metadata ? await tauri.fs.metadata(path) : null;
      if (md) out.fileMb = +(md.size / 1048576).toFixed(1);
    }
  } catch (e) { out.sizeErr = String(e); }

  const url = typeof getFileUrl === 'function' ? getFileUrl(file) : null;
  out.url = url ? url.slice(0, 46) + '…' : null;
  if (!url) return JSON.stringify(out);

  const t = async (label, fn) => { const a = performance.now(); const r = await fn(); out[label] = { ms: Math.round(performance.now() - a), val: r }; return r; };

  // (d) per-request floor: one 4 KiB Range read
  await t('range4k', async () => {
    const r = await fetch(url, { headers: { Range: 'bytes=0-4095' } });
    const b = await r.arrayBuffer();
    return { status: r.status, got: b.byteLength, accept: r.headers.get('Accept-Ranges'), len: r.headers.get('Content-Length') };
  });

  // (b) cold whole-file fetch
  const cacheBust = url + (url.includes('?') ? '&' : '?') + 'cb=' + Date.now();
  await t('coldWhole', async () => {
    const r = await fetch(cacheBust);
    const b = await r.arrayBuffer();
    out.bytes = b.byteLength; out.mb = +(b.byteLength / 1048576).toFixed(1);
    out.mbps = +(b.byteLength / 1048576 / ((performance.now() - 0) / 1000 || 1)).toFixed(1);
    window.__r72buf = b;
    return { status: r.status, mb: out.mb };
  });

  // (c) warm fetch (same URL, browser HTTP cache)
  await t('warmWhole', async () => {
    const r = await fetch(url);
    const b = await r.arrayBuffer();
    return { status: r.status, mb: +(b.byteLength / 1048576).toFixed(1) };
  });

  // (e) parse cost on the buffer we already hold — and the precondition for everything that
  //     follows: does this fixture carry SEI telemetry at all?
  if (window.DashcamMP4) {
    const a = performance.now();
    try {
      const raw = new window.DashcamMP4(window.__r72buf).parseMetadata();
      out.parse = { ms: Math.round(performance.now() - a), rawSei: raw.length };
      if (raw.length) {
        out.first = { time: raw[0].time, bytes: raw[0].data.length };
        out.last = { time: raw[raw.length - 1].time };
        const mm = v.metadataManager;
        await mm.waitForProtobuf?.();
        const t0 = performance.now();
        const tel = await mm.readTelemetry(file);
        out.decoded = { ms: Math.round(performance.now() - t0), n: tel.length, speed0: tel[0]?.data?.vehicleSpeedMps };
      }
    } catch (e) { out.parse = { err: String(e), ms: Math.round(performance.now() - a) }; }
  } else out.parse = { err: 'no DashcamMP4 global' };

  // throughput derived from bytes / cold ms
  if (out.bytes && out.coldWhole) out.mbps = +(out.bytes / 1048576 / (out.coldWhole.ms / 1000)).toFixed(1);
  delete window.__r72buf;
  return JSON.stringify(out, null, 1);
})()

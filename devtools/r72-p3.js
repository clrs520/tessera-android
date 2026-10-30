// R72 p3: the precondition + the honest per-segment cost, in one clean pass.
// (r72-p2 appended ?cb= to the media URL to defeat the HTTP cache and got 403 — the server
//  validates the whole request target, so the buffer it parsed was empty.)
(async () => {
  const out = {};
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const ev = v.continuousPlayer.currentEvent;
  if (!ev) return JSON.stringify({ err: 'no event' });
  const file = ev.segments?.[0]?.files?.front;
  if (!file) return JSON.stringify({ err: 'no front file' });
  out.file = file.name;

  const url = getFileUrl(file);
  let buf = null;
  const t0 = performance.now();
  const r = await fetch(url);
  const rb = performance.now();
  if (!r.ok) return JSON.stringify({ err: `HTTP ${r.status}` });
  buf = await r.arrayBuffer();
  const t1 = performance.now();
  out.mb = +(buf.byteLength / 1048576).toFixed(1);
  out.fetchMs = Math.round(t1 - t0);
  out.headersMs = Math.round(rb - t0);
  out.mbps = +(out.mb / ((t1 - t0) / 1000)).toFixed(1);

  const t2 = performance.now();
  let raw = [];
  try { raw = new window.DashcamMP4(buf).parseMetadata(); }
  catch (e) { out.parseErr = String(e); }
  out.walkMs = Math.round(performance.now() - t2);
  out.rawSei = raw.length;
  if (raw.length) {
    out.firstTime = raw[0].time; out.lastTime = raw[raw.length - 1].time;
    out.payloadBytes = raw.reduce((s, x) => s + x.data.length, 0);
    out.avgPayload = Math.round(out.payloadBytes / raw.length);
  }

  const mm = v.metadataManager;
  await mm.waitForProtobuf?.();
  MetadataManager.seiCache.delete(file.path);
  const t3 = performance.now();
  const tel = await mm.readTelemetry(file);
  out.readTelemetryMs = Math.round(performance.now() - t3);
  out.decoded = tel.length;
  out.speed0 = tel[0]?.data?.vehicleSpeedMps;
  out.hasNumberedTelemetry = tel.some(x => typeof x.data?.vehicleSpeedMps === 'number' && x.data.vehicleSpeedMps > 0);
  MetadataManager.seiCache.delete(file.path);
  buf = null;
  return JSON.stringify(out, null, 1);
})()

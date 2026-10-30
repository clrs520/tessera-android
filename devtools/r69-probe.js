// R69: where does the speed curve's delay actually go? Time the three steps the loader takes
// for one real 53 MB front segment: fetch, MP4 box walk, protobuf decode.
(async () => {
  const g = (viewer.eventGroups || []).find(x => x.eventId.includes('2026-10-08_07-41-59'));
  if (!g) return 'NO_EVENT';
  const file = g.segments[0].files.front;
  if (!file) return 'NO_FILE';
  const out = { path: file.path, size: file.size };
  const t = () => performance.now();

  const a = t();
  const resp = await fetch(getFileUrl(file));
  const buf = await resp.arrayBuffer();
  const b = t();
  out.fetchMs = Math.round(b - a);
  out.bytes = buf.byteLength;
  out.status = resp.status;

  const parser = new DashcamMP4(buf);
  const raw = parser.parseMetadata();
  const c = t();
  out.parseMs = Math.round(c - b);
  out.seiCount = raw.length;

  const Sei = viewer.metadataManager && viewer.metadataManager.SeiMetadata;
  out.haveSei = !!Sei;
  if (Sei) {
    const d0 = t();
    let ok = 0;
    for (const item of raw) {
      try { Sei.decode(item.data); ok++; } catch (e) { }
    }
    out.decodeMs = Math.round(t() - d0);
    out.decoded = ok;
  }
  // Second fetch of the same file: is the loopback server / HTTP cache warm?
  const e0 = t();
  const r2 = await fetch(getFileUrl(file));
  await r2.arrayBuffer();
  out.fetch2Ms = Math.round(t() - e0);
  return JSON.stringify(out);
})()

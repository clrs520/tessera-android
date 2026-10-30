// Baseline: time loadMetadataForSegments per camera on the CURRENT build, wired exactly the way
// processClip wires it (this.metadataManager), and report what each file object looks like.
(function () {
  window.__r73b = { running: true };
  (async () => {
    const CAMS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
    const out = { cameras: {}, shape: {} };
    try {
      const event = viewer.currentEvent;
      if (!event) { out.error = 'no event loaded'; window.__r73b = out; return; }
      const durs = event.segmentDurations || [];
      const clipSegments = event.segments.map((seg, i) => ({
        segment: seg,
        clipStart: event.segmentStartTimes?.[i] ?? i * 60,
        clipEnd: (event.segmentStartTimes?.[i] ?? i * 60) + (durs[i] || 60),
      }));
      out.segmentCount = clipSegments.length;
      const proc = viewer.videoClipProcessor;
      proc.metadataManager = viewer.metadataManager;      // what processClip does at its top
      proc.isCancelled = false;
      for (const cam of CAMS) {
        const f = event.segments[0].files[cam];
        out.shape[cam] = { isFile: f instanceof File, path: f && f.path ? f.path.split('/').pop() : null,
          name: f && f.name ? f.name : null, size: f && f.size != null ? f.size : null,
          tauri: typeof window.__TAURI__ };
      }
      for (const cam of CAMS) {
        MetadataManager.seiCache.clear();                 // cold, like a real export
        const t0 = performance.now();
        const meta = await proc.loadMetadataForSegments(clipSegments, cam, null);
        const ms = performance.now() - t0;
        const pts = meta.reduce((n, s) => n + s.metadata.length, 0);
        const seg0 = meta[0] && meta[0].metadata[0];
        out.cameras[cam] = { ms: +ms.toFixed(1), segments: meta.length, points: pts,
          firstTime: seg0 ? seg0.time : null,
          firstSpeed: seg0 ? Number(seg0.data.vehicleSpeedMps) : null };
      }
      out.sumMs = +Object.values(out.cameras).reduce((a, c) => a + c.ms, 0).toFixed(1);
    } catch (e) {
      out.threw = String(e && e.stack || e);
    }
    out.running = false;
    window.__r73b = out;
  })();
  return 'armed';
})()

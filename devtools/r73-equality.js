// One session, both paths, per camera: the new native branch vs a verbatim copy of the old
// whole-file JS decode, timed alternately with playback paused, plus point-by-point equality and
// the URLs any residual fetch actually touched.
(function () {
  window.__r73q = { running: true };
  (async () => {
    const CAMS = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
    const out = { cameras: {}, urls: {} };
    const realFetch = window.fetch;
    const seen = [];
    window.fetch = function (url) {
      const p = realFetch.apply(this, arguments);
      p.then(res => {
        const clone = res.clone();
        clone.arrayBuffer().then(b => {
          if (String(url).includes('.mp4')) seen.push({ url: String(url).slice(-40), bytes: b.byteLength });
        }).catch(() => {});
        return res;
      }).catch(() => {});
      return p;
    };
    try {
      const event = viewer.currentEvent;
      if (!event) { out.error = 'no event loaded'; window.__r73q = out; return; }
      for (const v of document.querySelectorAll('video')) { try { v.pause(); } catch (e) {} }
      const durs = event.segmentDurations || [];
      const clipSegments = event.segments.map((seg, i) => ({
        segment: seg,
        clipStart: event.segmentStartTimes?.[i] ?? i * 60,
        clipEnd: (event.segmentStartTimes?.[i] ?? i * 60) + (durs[i] || 60),
      }));
      const proc = viewer.videoClipProcessor;
      proc.metadataManager = viewer.metadataManager;
      proc.isCancelled = false;
      const mm = viewer.metadataManager;

      const jsRead = async (cam) => {
        const res = await realFetch.call(window, getFileUrl(clipSegments[0].segment.files[cam]));
        const buffer = await res.arrayBuffer();
        const raw = new DashcamMP4(buffer).parseMetadata();
        return raw.map(item => {
          try {
            const decoded = mm.SeiMetadata.decode(item.data);
            return { time: item.time, segmentIndex: 0,
              data: mm.SeiMetadata.toObject(decoded, { enums: String, longs: String }) };
          } catch (e) { return null; }
        }).filter(Boolean);
      };
      const med = a => { const s = a.slice().sort((x, y) => x - y); return s[(s.length - 1) >> 1]; };

      for (const cam of CAMS) {
        const nT = [], jT = [];
        let nativeShape = null, jsShape = null;
        for (let round = 0; round < 2; round++) {
          MetadataManager.seiCache.clear();
          seen.length = 0;
          let t0 = performance.now();
          const nativeWrap = await proc.loadMetadataForSegments(clipSegments, cam, null);
          nT.push(+(performance.now() - t0).toFixed(1));
          nativeShape = nativeWrap[0] ? nativeWrap[0].metadata : [];

          t0 = performance.now();
          jsShape = await jsRead(cam);
          jT.push(+(performance.now() - t0).toFixed(1));

          if (round === 0) {
            out.urls[cam] = { mp4FetchesDuringNative: seen.length, bytes: seen.reduce((a, s) => a + s.bytes, 0) };
          }
        }
        const same = nativeShape.length === jsShape.length
          && nativeShape.every((p, k) => p.time === jsShape[k].time && JSON.stringify(p.data) === JSON.stringify(jsShape[k].data));
        let firstDiff = null;
        if (!same) {
          for (let k = 0; k < Math.max(nativeShape.length, jsShape.length); k++) {
            const a = nativeShape[k], b = jsShape[k];
            if (!a || !b || a.time !== b.time || JSON.stringify(a.data) !== JSON.stringify(b.data)) {
              firstDiff = { k, native: a || null, js: b || null }; break;
            }
          }
        }
        const readouts = [];
        let readoutsMatch = true;
        const wrapNative = [{ segmentIndex: 0, metadata: nativeShape }];
        const wrapJs = [{ segmentIndex: 0, metadata: jsShape }];
        for (const t of [0, 0.4, 1.1, 2.0, 3.7, 5.9]) {
          const a = proc.getMetadataAtTime(wrapNative, 0, t);
          const b = proc.getMetadataAtTime(wrapJs, 0, t);
          const f = d => d ? `${Math.round(Number(d.vehicleSpeedMps) * 3.6)}|${d.gearState}|${d.autopilotState}` : 'null';
          if (f(a) !== f(b)) readoutsMatch = false;
          readouts.push(`t${t}=${f(a)}`);
        }
        out.cameras[cam] = {
          nativeMedian: med(nT), jsMedian: med(jT), nativeMs: nT, jsMs: jT,
          pointsNative: nativeShape.length, pointsJs: jsShape.length, equal: same, firstDiff,
          readoutsMatch, readouts,
          fields: nativeShape[0] ? Object.keys(nativeShape[0].data).length : 0,
        };
      }
      out.sumNative = +CAMS.reduce((a, c) => a + out.cameras[c].nativeMedian, 0).toFixed(1);
      out.sumJs = +CAMS.reduce((a, c) => a + out.cameras[c].jsMedian, 0).toFixed(1);
      out.allEqual = CAMS.every(c => out.cameras[c].equal && out.cameras[c].readoutsMatch);
      out.noMp4FetchOnNative = CAMS.every(c => out.urls[c].mp4FetchesDuringNative === 0);
    } catch (e) {
      out.threw = String(e && e.stack || e);
    } finally {
      window.fetch = realFetch;
    }
    out.running = false;
    window.__r73q = out;
  })();
  return 'armed';
})()

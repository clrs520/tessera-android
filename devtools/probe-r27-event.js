(() => {
  const b64 = (s) => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); return atob(t + '='.repeat((4 - t.length % 4) % 4)); };
  const v = window.viewer || {};
  const ev = v.currentEvent || null;
  const segs = ev && ev.segments ? ev.segments.map(s => ({
    idx: ev.segments.indexOf(s),
    files: Object.fromEntries(Object.entries(s.files || {}).map(([k, f]) => [k, String(f.name || f.path || f).split('/').pop()])),
  })) : [];
  return JSON.stringify({
    event: ev ? { id: ev.id, name: ev.name, date: ev.date, dir: ev.directory || ev.dir || null, segCount: ev.segments.length, totalDuration: ev.totalDuration, segDurations: ev.segmentDurations, type: ev.eventType } : null,
    segs,
    mediaDir: localStorage.getItem('tdashcam.mediaDir'),
    playing: [...document.querySelectorAll('video')].map(el => {
      const m = el.src.match(/\/media\/[^/]+\/([^?]+)/);
      let p = '(none)';
      if (m) {
        let s = m[1].replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        try { p = decodeURIComponent(atob(s)); } catch (e) { p = 'b64fail:' + m[1]; }
      }
      return { id: el.id, path: p, vw: el.videoWidth, vh: el.videoHeight, dur: isFinite(el.duration) ? +el.duration.toFixed(2) : null };
    }),
  }, null, 1);
})()

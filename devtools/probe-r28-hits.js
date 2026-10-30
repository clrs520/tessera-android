(() => {
  const r = el => { const b = el.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
  const cs = el => getComputedStyle(el);
  const ids = ['playPauseBtn', 'progressBar', 'videoTimeDisplay', 'speedBtn', 'fullscreenBtn', 'gridBtn', 'pipBtn', 'scissorsBtn', 'snapshotBtn', 'metaSwitchBtn', 'metaDetailBtn', 'tabListBtn', 'tabMoreBtn', 'tabLayoutBtn', 'tabRefreshBtn', 'tabFolderBtn', 'statsCloseBtn'];
  const out = [];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) { out.push({ id, miss: 1 }); continue; }
    const s = cs(el);
    const q = el.getBoundingClientRect();
    if (s.display === 'none' || s.visibility === 'hidden' || q.width === 0) { out.push({ id, hidden: s.display }); continue; }
    const cx = Math.round(q.x + q.width / 2), cy = Math.round(q.y + q.height / 2);
    if (cy < 0 || cy > innerHeight || cx < 0 || cx > innerWidth) { out.push({ id, off: [cx, cy] }); continue; }
    const hit = document.elementFromPoint(cx, cy);
    const ok = hit && (hit === el || el.contains(hit) || hit.contains(el));
    out.push({ id, ok: !!ok, rect: r(el), hit: ok ? null : (hit ? (hit.id || hit.tagName + '.' + (hit.className || '').toString().split(' ')[0]) : 'none') });
  }
  return JSON.stringify({ vp: [innerWidth, innerHeight], body: document.body.className, bad: out.filter(o => !o.ok && !o.hidden && !o.miss), all: out }, null, 1);
})()

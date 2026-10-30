(() => {
  const v = window.viewer || {};
  const mm = v.metadataManager || {};
  const dv = mm.dom || {};
  const txt = (sel) => { const el = document.querySelector(sel); return el ? (el.textContent || '').trim().replace(/\s+/g, ' ') : null; };
  const vis = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { d: s.display, v: s.visibility, op: +(+s.opacity).toFixed(2), z: s.zIndex, r: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
  };
  const q = (id) => document.getElementById(id);

  // Screens that say undefined / NaN / [object — the usual fallout of a field rename.
  const junk = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.nodeValue || '').trim();
    if (!t) continue;
    if (!/undefined|NaN|\[object |Infinity/.test(t)) continue;
    const p = n.parentElement;
    if (!p) continue;
    const s = getComputedStyle(p);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    junk.push({ text: t.slice(0, 60), tag: p.tagName, id: p.id || null, cls: (p.className || '').toString().slice(0, 40) });
  }

  const vids = [...document.querySelectorAll('video')];
  const videoState = vids.map((el) => {
    const box = el.parentElement;
    const cs = getComputedStyle(el);
    return {
      cam: el.dataset.camera || (el.id || '?'),
      rs: el.readyState, err: el.error ? el.error.code : null, paused: el.paused,
      rate: el.playbackRate, t: +el.currentTime.toFixed(2),
      dur: isFinite(el.duration) ? +el.duration.toFixed(2) : null,
      vw: el.videoWidth, vh: el.videoHeight,
      src: /\/media\//.test(el.src) ? 'media' : (el.src ? 'other' : 'empty'),
      fit: cs.objectFit, boxAspect: box ? getComputedStyle(box).aspectRatio : null,
      box: box ? [Math.round(box.getBoundingClientRect().width), Math.round(box.getBoundingClientRect().height)] : null,
    };
  });

  return JSON.stringify({
    vp: [window.innerWidth, window.innerHeight],
    phoneLayout: (typeof isPhoneLayout === 'function') ? isPhoneLayout() : null,
    playerClass: dv.playerArea ? dv.playerArea.className : null,
    recentErrors: (v.recentErrors || []).slice(-5),
    banner: vis(q('jsErrorBanner')),
    junk: junk.slice(0, 12), junkCount: junk.length,
    speedBtn: txt('#speedBtn'), playRate: vids.length ? vids[0].playbackRate : null,
    timeDisplay: txt('#videoTimeDisplay'),
    progressPlayed: (() => { const e = q('progressPlayed'); return e ? { st: e.style.width, w: Math.round(e.getBoundingClientRect().width) } : null; })(),
    timePreview: vis(q('timePreview')),
    fsBtn: vis(q('fullscreenBtn')), fsDisabled: q('fullscreenBtn')?.disabled,
    bodyFs: document.body.classList.contains('phone-fullscreen'),
    brightness: { level: v.brightnessLevel ?? mm.brightnessLevel, stored: localStorage.getItem('tdashcam.brightness'), dim: vis(q('phoneBrightnessDim')) },
    hud: vis(dv.panel), hudCollapsed: dv.panel ? dv.panel.classList.contains('collapsed') : null,
    hudHasData: dv.panel ? dv.panel.classList.contains('has-data') : null,
    hudEmptyText: txt('#metadataEmpty'), userPinned: mm.userPinned,
    eventPlace: typeof mm.eventPlace === 'function' ? mm.eventPlace() : null,
    seiCount: (mm.currentMetadata || []).length,
    plate: vis(q('metaDetailOverlay')),
    overlay: vis(q('videoControlsOverlay')),
    videos: videoState,
  }, null, 1);
})()

(function () {
  function m(id) {
    var o = document.getElementById(id);
    if (!o) return { id: id, missing: 1 };
    var cs = getComputedStyle(o);
    var p = o.querySelector(".modal-content");
    var pr = p ? p.getBoundingClientRect() : null;
    var g = p ? p.querySelector(".sheet-grabber") : null;
    var gr = g ? g.getBoundingClientRect() : null;
    var gcs = g ? getComputedStyle(g) : null;
    return {
      id: id,
      display: cs.display,
      align: cs.alignItems,
      show: o.classList.contains("show"),
      panel: pr ? [Math.round(pr.x), Math.round(pr.y), Math.round(pr.width), Math.round(pr.height)] : null,
      gapBottom: pr ? Math.round(innerHeight - pr.bottom) : null,
      transform: p ? getComputedStyle(p).transform : null,
      radius: p ? getComputedStyle(p).borderRadius : null,
      grabDisplay: gcs ? gcs.display : null,
      grabTouchAction: gcs ? gcs.touchAction : null,
      grabRect: gr ? [Math.round(gr.x), Math.round(gr.y), Math.round(gr.width), Math.round(gr.height)] : null,
      overflow: p ? [p.scrollWidth, p.clientWidth, p.scrollHeight, p.clientHeight] : null,
      closeBtn: (function () {
        var c = o.querySelector(".modal-close-corner, .close-modal-btn");
        if (!c) return null;
        var r = c.getBoundingClientRect();
        return { id: c.className, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      })()
    };
  }
  return JSON.stringify(["phoneExportModal", "clipModal", "androidDirModal", "aboutModal", "filePathModal", "deleteConfirmModal"].map(m));
})()

// R146 诊断：那一下真实点击到底产生了什么事件、被谁吃掉了。
// 探针只挂监听不改逻辑；跑完记得刷新页面把它摘掉。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const area = document.getElementById('playerArea');
  const pip = document.getElementById('left-container');
  const b = pip.getBoundingClientRect();
  const cx = Math.round(b.x + b.width / 2), cy = Math.round(b.y + b.height / 2);
  const d = devicePixelRatio;

  window.__r146log = [];
  const rec = t => e => window.__r146log.push({
      t, type: e.type, tgt: e.target.id ? '#' + e.target.id : e.target.tagName + '.' + String(e.target.className).split(' ')[0],
      insidePip: e.target === pip || pip.contains(e.target), x: Math.round(e.clientX), y: Math.round(e.clientY),
      cancelable: e.cancelable, defaultPrevented: e.defaultPrevented });
  for (const ty of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click']) {
      area.addEventListener(ty, rec(ty), true);
  }
  document.addEventListener('click', rec('doc-click'), true);

  return JSON.stringify({ pipCentreCss: { x: cx, y: cy },
      pipDev: { x: Math.round(cx * d), y: Math.round(cy * d) },
      hit: (() => { const n = document.elementFromPoint(cx, cy); return n ? (n.id || n.tagName + '.' + String(n.className).split(' ')[0]) : 'null'; })(),
      suppressUntilDelta: (v.suppressPlayerTapUntil || 0) - Date.now(),
      active: v.multiCameraPlayer.activeCamera, shown: document.getElementById('videoControlsOverlay').classList.contains('show') });
})()

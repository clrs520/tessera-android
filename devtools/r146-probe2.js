// R146 第二步：遮罩里到底哪些子元素是交互的、它们的 y 区间和小窗的 y 区间怎么叠。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const ov = document.getElementById('videoControlsOverlay');
  v.videoControls.showControls();
  await sleep(400);
  const R = el => { const b = el.getBoundingClientRect();
      return { y: Math.round(b.y), h: Math.round(b.height), x: Math.round(b.x), w: Math.round(b.width),
               pe: getComputedStyle(el).pointerEvents }; };
  const pick = sel => { const e = ov.querySelector(sel); return e ? R(e) : null; };
  const pipR = cam => { const e = document.getElementById(`${cam}-container`); return e ? R(e) : null; };
  const kids = [...ov.querySelectorAll(':scope > *, :scope > * > *')].map(e => ({
      sel: e.id ? '#' + e.id : '.' + String(e.className).split(' ')[0], ...R(e) }));
  return JSON.stringify({ overlay: R(ov), progress: pick('#progressContainer'),
      btnRow: pick('.video-controls-row') || pick('.controls-row'), pips: { back: pipR('back'), left: pipR('left'), right: pipR('right') },
      kids }, null, 1);
})()

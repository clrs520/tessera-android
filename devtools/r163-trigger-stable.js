// R163 — the amber trigger frame must be derived from the cell and the clip ratio, not from the
// <video> element's transient rect. A segment swap briefly hands the element a different box; the
// old measurement followed it and the 0.3s CSS transition turned that into a visible up/down wobble.
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 400));
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ err: 'no viewer' });
  await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');
  for (let i = 0; i < 120 && !(v.eventGroups || []).length; i++) await sleep(100);
  const ev = (v.eventGroups || []).find(e => /2026-10-09_10-00-00_sentry/.test(e.eventId));
  if (!ev) return JSON.stringify({ err: 'trigger fixture missing' });
  await v.playEvent(ev.eventId);
  for (let i = 0; i < 120 && v.currentEvent?.eventId !== ev.eventId; i++) await sleep(100);

  const single = document.querySelector('.view-btn[data-view="front"]');
  if (single) single.click();
  await sleep(900);
  v.applyTriggerHighlight(ev);
  await sleep(700);

  const cell = document.querySelector('#playerArea .video-container[data-camera="front"]');
  const video = cell?.querySelector('video');
  if (!cell || !video) return JSON.stringify({ err: 'front cell missing' });
  for (let i = 0; i < 60 && !video.videoWidth; i++) await sleep(100);
  v.layoutTriggerFrames();
  const read = () => ({
    top: parseFloat(getComputedStyle(cell).getPropertyValue('--trigger-top')),
    height: parseFloat(getComputedStyle(cell).getPropertyValue('--trigger-height')),
    width: parseFloat(getComputedStyle(cell).getPropertyValue('--trigger-width')),
  });
  const cellW = cell.clientWidth, cellH = cell.clientHeight;
  const ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : null;
  const expectedH = ratio ? Math.min(cellW, cellH * ratio) / ratio : cellH;
  const expectedTop = (cellH - expectedH) / 2;
  const before = read();

  // What a splice hands the frame: the element on screen is temporarily not the cell box.
  const oldCss = video.getAttribute('style') || '';
  video.style.position = 'absolute';
  video.style.left = '25%';
  video.style.top = '25%';
  video.style.width = '50%';
  video.style.height = '50%';
  v.layoutTriggerFrames();
  const after = read();
  video.setAttribute('style', oldCss);
  v.layoutTriggerFrames();

  return JSON.stringify({
    triggerCam: cell.classList.contains('trigger-cam'),
    cell: `${cellW}x${cellH}`,
    ratio: ratio && +ratio.toFixed(4),
    before,
    after,
    expected: { top: +expectedTop.toFixed(1), height: +expectedH.toFixed(1) },
    stable: Math.abs(before.top - after.top) < 1 && Math.abs(before.height - after.height) < 1,
    encloses: Math.abs(before.top - expectedTop) < 1.5 && Math.abs(before.height - expectedH) < 1.5,
  });
})()

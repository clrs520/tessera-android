(() => {
  const v = window.viewer;
  const area = v.dom.playerArea;
  if (window.__r60hook) return 'already';
  window.__r60hook = [];
  const log = (e) => window.__r60hook.push(e.type.slice(7,10) + ' ' + Math.round(e.clientX) + ',' + Math.round(e.clientY) + ' pt=' + e.pointerType + ' tgt=' + (e.target.className||e.target.tagName).toString().split(' ')[0] + ' fingers=' + v.pictureFingers.size);
  ['pointerdown','pointermove','pointerup','pointercancel'].forEach(t => area.addEventListener(t, log, true));
  const orig = v.stepThroughEvents.bind(v);
  window.__r60steps = [];
  v.stepThroughEvents = (d) => { window.__r60steps.push(d); return orig(d); };
  return 'hooked';
})()

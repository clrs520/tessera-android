(function () {
  const cp = window.viewer && window.viewer.continuousPlayer;
  if (!cp) return 'NO CONTINUOUS PLAYER';
  const player = cp.multiCameraPlayer && cp.multiCameraPlayer.players.front;
  if (!player) return 'NO FRONT PLAYER';
  const tail = v => String(v == null ? '-' : v).replace(/^https?:\/\/[^/]*\//, '').slice(-24);
  if (!window.__r78) window.__r78 = [];
  const L = m => { if (window.__r78.length < 200) window.__r78.push(m); };

  if (!window.__r78armed) {
    window.__r78armed = true;
    const origNote = cp.noteAxis.bind(cp);
    const origRecord = cp.recordAxis.bind(cp);
    const origAwait = cp.awaitAxisMeta.bind(cp);
    cp.noteAxis = function (index) {
      L('NOTE i=' + index + ' idx=' + this.currentSegmentIndex +
        ' rs=' + player.readyState + ' dur=' + player.duration +
        ' seen=[' + Object.keys(this.axisSeen || {}).join(',') + ']' +
        ' src=' + tail(player.src) + ' wait=' + (player.axisWait ? tail(player.axisWait.url) : 'none'));
      return origNote(index);
    };
    cp.recordAxis = function (index, real) {
      L('RECORD i=' + index + ' real=' + real);
      return origRecord(index, real);
    };
    cp.awaitAxisMeta = function (index, p) {
      L('AWAIT i=' + index + ' p=' + tail(p && p.src));
      const r = origAwait(index, p);
      L('AWAIT -> wait=' + (p && p.axisWait ? tail(p.axisWait.url) : 'none'));
      return r;
    };

    player.addEventListener('loadedmetadata', () => {
      L('LM src=' + tail(player.src) + ' wait=' + (player.axisWait ? tail(player.axisWait.url) : 'none') +
        ' idx=' + cp.currentSegmentIndex + ' dur=' + player.duration + ' rs=' + player.readyState);
    });
    player.addEventListener('emptied', () => L('EMPTIED src=' + tail(player.src) + ' idx=' + cp.currentSegmentIndex));
    player.addEventListener('error', () => L('ERROR src=' + tail(player.src) + ' idx=' + cp.currentSegmentIndex));
  }
  return 'ARMED idx=' + cp.currentSegmentIndex + ' seen=[' + Object.keys(cp.axisSeen || {}).join(',') + ']';
})();

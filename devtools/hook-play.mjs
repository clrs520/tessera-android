(() => {
  if (window.__playLog) return 'already';
  window.__playLog = [];
  const orig = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    const id = this.id;
    return orig.call(this).then(
      () => { window.__playLog.push(id + ':ok@' + this.currentTime.toFixed(2)); },
      (e) => { window.__playLog.push(id + ':' + e.name + ':' + String(e.message).slice(0, 50)); throw e; }
    );
  };
  return 'hooked';
})()

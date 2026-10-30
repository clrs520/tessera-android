(() => { const b = document.getElementById('jsErrorBanner');
  if (b) { b.style.display = 'none'; b.textContent = ''; }
  viewer.seekToTime ? viewer.seekToTime(250) : viewer.continuousPlayer.seekToTime(250);
  return 'ok'; })()

(() => {
  try {
    const want = parseFloat(window.__tuneA ?? 0.10);
    let s = document.getElementById('r61preview');
    if (!s) { s = document.createElement('style'); s.id = 'r61preview'; document.head.appendChild(s); }
    s.textContent = 'body.dark-theme .player-area.empty .empty-hero { background-color: rgba(255,255,255,' + want + '); }';
    return 'alpha=' + s.textContent.match(/,([\d.]+)\)/)[1];
  } catch (e) { return 'THREW ' + e.message; }
})()

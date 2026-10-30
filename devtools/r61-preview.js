(() => {
  try {
    const css = `
body.dark-theme .player-area.empty .empty-hero { background-color: rgba(255, 255, 255, 0.12); }
.player-area.empty .empty-hero { z-index: 40; }
html.solid-material body.dark-theme .player-area.empty .empty-hero { background-color: #3c3e44; }
`;
    let s = document.getElementById('r61preview');
    if (!s) { s = document.createElement('style'); s.id = 'r61preview'; document.head.appendChild(s); }
    s.textContent = css;
    const hero = document.querySelector('#emptyHero');
    const r = hero.getBoundingClientRect();
    return JSON.stringify({ injected: true, heroBg: getComputedStyle(hero).backgroundColor, heroZ: getComputedStyle(hero).zIndex,
      centre: [Math.round(r.left + r.width/2), Math.round(r.top + r.height/2)] });
  } catch (e) { return 'THREW ' + e.message; }
})()

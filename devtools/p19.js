(() => {
    const s = window.__samples || [];
    const bad = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i].paused && s[i].play) bad.push({ t: s[i].t, ct: s[i].ct, seg: s[i].seg });
    }
    const S = (window.__seeklog || []).filter(e => e.ev === 'apply');
    const steps = S.map(e => +(e.want - e.from).toFixed(2));
    const frameSteps = steps.filter(d => Math.abs(d) < 1);
    return JSON.stringify({
        flagLiesSamples: bad.length,
        flagLies: bad.slice(0, 10),
        appliesSeen: S.length,
        steps,
        frameSteps: frameSteps.length,
        pausedAtEnd: document.querySelector('#front-player').paused,
        ended: document.querySelector('#front-player').ended,
        ct: viewer.continuousPlayer.getCurrentTime().toFixed(2),
    }, null, 1);
})()

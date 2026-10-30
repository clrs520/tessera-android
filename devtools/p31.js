(() => {
    // 「画面停了，进度条还说播放中」 is the state the user reads as 卡死. The flag is only written by the
    // feed's own play/pause events, so a play() that a later cleanup() paused never lands — count the
    // samples where the two disagree.
    const s = window.__samples || [];
    const lies = s.filter(x => x.play === 1 && x.paused === 1);
    return JSON.stringify({
        ring: s.length,
        lieSamples: lies.length,
        lieMs: lies.length * 300,
        firstLieT: lies.length ? lies[0].t : null,
        lastLieT: lies.length ? lies[lies.length - 1].t : null,
        frameSteps: (window.__seeklog || []).filter(e => e.ev === 'apply' && Math.abs(e.want - e.from) < 1).length,
        flag: viewer.multiCameraPlayer.isPlaying,
        paused: !!document.querySelector('#front-player').paused,
        ct: +viewer.continuousPlayer.getCurrentTime().toFixed(1),
    }, null, 1);
})()

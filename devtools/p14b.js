(() => {
    const s = window.__samples || [];
    const stalls = [];
    for (let i = 0; i < s.length; i++) {
        if (s[i].paused) continue;
        let j = i;
        while (j + 1 < s.length && s[j + 1].cam === s[i].cam && s[j + 1].seg === s[i].seg && Math.abs(s[j + 1].ct - s[i].ct) < 0.02 && !s[j + 1].paused) j++;
        if ((s[j].t - s[i].t) >= 700) { stalls.push({ t: s[i].t, ct: s[i].ct, ms: s[j].t - s[i].t, rs: s[i].rs, sk: s[i].sk, buf: s[i].buf, fpaused: s[i].fpaused }); i = j; }
    }
    const T = (window.__taps || []);
    const S = (window.__seeklog || []);
    const cross = S.filter(e => e.ev === 'apply' && e.seg && !/^(\d+)>\1$/.test(e.seg));
    const same = S.filter(e => e.ev === 'apply' && e.seg && /^(\d+)>\1$/.test(e.seg));
    const max = a => a.length ? Math.max(...a.map(x => x.ms)) : null;
    return JSON.stringify({
        taps: T.length,
        errs: (window.__errs || []).slice(-12),
        samples: s.length,
        last: s[s.length - 1] || null,
        total: String(viewer.continuousPlayer.totalDuration),
        layout: viewer.layoutMode,
        active: viewer.multiCameraPlayer.activeCamera,
        flag: viewer.videoControls && viewer.videoControls.isPlaying,
        frontPaused: document.querySelector('#front-player') ? document.querySelector('#front-player').paused : null,
        stallCount: stalls.length,
        stalls: stalls.slice(0, 12),
        applies: { count: S.filter(e => e.ev === 'apply').length, crossing: cross.length, maxCrossMs: max(cross), maxSameMs: max(same) },
        waits: S.filter(e => e.ev === 'wait').map(e => ({ ms: e.ms, to: e.timedOut })),
    }, null, 1);
})()

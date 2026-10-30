// A/B: same grab with the 6 player elements holding their decoders vs. released.
(async () => {
    const ctr = viewer.videoControls;
    const ev = viewer.currentEvent;
    const out = {};

    const grab = async (label, seconds) => {
        const t = ctr.clipFrameTarget(ev, ctr.totalDuration * seconds);
        const t0 = Date.now();
        const url = await FrameFetcher.get(t.path, t.seconds);
        out[label] = { ms: Date.now() - t0, ok: typeof url === 'string', sec: +t.seconds.toFixed(1), file: t.path.split('/').pop() };
    };

    const players = [...document.querySelectorAll('video')];
    const saved = players.map(v => ({ src: v.getAttribute('src'), ct: v.currentTime }));

    await grab('withPlayers', 0.55);

    players.forEach(v => { v.removeAttribute('src'); try { v.load(); } catch (e) {} });
    await new Promise(r => setTimeout(r, 500));
    out.playersReleased = true;
    await grab('noPlayers', 0.65);

    players.forEach((v, i) => { if (saved[i].src) { v.src = saved[i].src; v.currentTime = saved[i].ct; } });
    out.restored = players.map(v => v.readyState);
    return JSON.stringify(out);
})()

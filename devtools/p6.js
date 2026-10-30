(() => {
    const cp = viewer.continuousPlayer, p = viewer.multiCameraPlayer;
    window.__log = [];
    const t0 = performance.now();
    const mark = (name) => window.__log.push([name, Math.round(performance.now() - t0)]);
    const origLoad = cp.loadSegment.bind(cp);
    cp.loadSegment = async (i) => { mark('loadSegment:enter i=' + i); const r = await origLoad(i); mark('loadSegment:exit i=' + i); return r; };
    const origWait = p.waitForAllVideosLoaded.bind(p);
    p.waitForAllVideosLoaded = async (...a) => { mark('wait:enter srcs=' + Object.values(p.players).filter(v=>v.src).length);
      const r = await origWait(...a); mark('wait:exit ready=' + Object.values(p.players).map(v=>v.readyState).join(',')); return r; };
    const origCleanup = p.cleanup.bind(p);
    p.cleanup = () => { mark('cleanup'); return origCleanup(); };
    const origPlay = p.playAll.bind(p);
    p.playAll = async () => { mark('playAll'); const r = await origPlay(); mark('playAll:done'); return r; };
    return 'instrumented';
})()

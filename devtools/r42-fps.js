(() => {
    const mcp = window.viewer.multiCameraPlayer;
    const KEYS = ['front', 'back', 'left', 'right'];

    function sample(keys, ms) {
        return new Promise(resolve => {
            const state = {};
            keys.forEach(k => {
                const p = mcp.players[k];
                state[k] = { count: 0, last: 0, gaps: [] };
                const tick = (now, meta) => {
                    const s = state[k];
                    if (s.last) s.gaps.push(now - s.last);
                    s.last = now;
                    s.count++;
                    if (s.count * 1 < 1e9) p.requestVideoFrameCallback(tick);
                };
                if (p.requestVideoFrameCallback) p.requestVideoFrameCallback(tick);
            });
            setTimeout(() => {
                const out = {};
                keys.forEach(k => {
                    const s = state[k];
                    const sorted = s.gaps.slice().sort((a, b) => a - b);
                    out[k] = {
                        frames: s.count,
                        fps: +(s.count * 1000 / ms).toFixed(1),
                        maxGapMs: sorted.length ? Math.round(sorted[sorted.length - 1]) : null,
                        p95GapMs: sorted.length ? Math.round(sorted[Math.floor(sorted.length * 0.95)]) : null,
                    };
                });
                resolve(out);
            }, ms);
        });
    }

    async function run() {
        const dur = mcp.players.front.duration || 18;
        const target = Math.min(4, dur * 0.2);
        mcp.seekAll(target);
        mcp.isPlaying = true;
        await mcp.playAll();
        await new Promise(r => setTimeout(r, 1200));
        const four = await sample(KEYS, 2500);
        const drift1 = Math.max(...KEYS.map(k => Math.abs(mcp.players[k].currentTime - mcp.players.front.currentTime)));

        // A/B: put the two suspended feeds back on screen's worth of work, i.e. the old behaviour
        // where every feed decoded whether or not the layout showed it.
        ['left_pillar', 'right_pillar'].forEach(k => { mcp.suspendedFeeds.delete(k); mcp.players[k].play().catch(() => {}); });
        await new Promise(r => setTimeout(r, 1200));
        const six = await sample(KEYS, 2500);
        const drift2 = Math.max(...KEYS.map(k => Math.abs(mcp.players[k].currentTime - mcp.players.front.currentTime)));

        ['left_pillar', 'right_pillar'].forEach(k => { mcp.players[k].pause(); mcp.suspendedFeeds.add(k); });
        mcp.pauseAll();

        return JSON.stringify({
            target: +target.toFixed(2),
            onlyVisiblePlaying: four,
            driftAfterVisibleOnly: +drift1.toFixed(2),
            allSixPlaying: six,
            driftAfterAllSix: +drift2.toFixed(2),
            mode: mcp.layoutMode,
            suspended: Array.from(mcp.suspendedFeeds),
        });
    }

    return run();
})()

// R181 · 竖屏全量回归三条红的现场取证：播放到底卡在哪一步。
// 只回布尔/计数/状态码，绝不回 token、完整路径或查询串。
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const vids = [...document.querySelectorAll('video')];
    const info = vids.slice(0, 3).map((x) => ({
        hasSrc: !!x.currentSrc || !!x.getAttribute('src'),
        srcLen: (x.currentSrc || x.getAttribute('src') || '').length,
        rs: x.readyState,
        nw: x.videoWidth,
        nh: x.videoHeight,
        paused: x.paused,
        err: x.error ? x.error.code : null,
        networkState: x.networkState,
        display: getComputedStyle(x).display,
        rect: (() => { const r = x.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
        inDoc: x.isConnected,
    }));
    const ev = v.currentEvent;
    const out = {
        orient: `${innerWidth}x${innerHeight}`,
        cur: !!ev,
        curId: ev && ev.eventId ? String(ev.eventId).slice(0, 8) : null,
        segs: ev && ev.segments ? ev.segments.length : (ev && ev.videos ? ev.videos.length : null),
        isPlaying: !!(v.multiCameraPlayer && v.multiCameraPlayer.isPlaying),
        grid: v.currentGridLayout,
        videoCount: vids.length,
        info,
        // 本地流服务是否可达：只取状态码，不打印 URL
        http: await (async () => {
            const s = vids.find((x) => (x.currentSrc || '').startsWith('http'));
            if (!s) return 'no http src';
            try {
                const r = await fetch(s.currentSrc, { method: 'GET', headers: { Range: 'bytes=0-1023' } });
                return `${r.status}/${(r.headers.get('content-length') || r.headers.get('content-range') || '').slice(0, 12)}`;
            } catch (e) { return 'fetch ' + String(e && e.message).slice(0, 40); }
        })(),
    };
    // 手动走一次用户路径：点第一张卡片，看能不能起来
    const card = document.querySelector('.event-card, .event-item, [data-event-id]');
    out.cardFound = !!card;
    if (card) card.click();
    for (let i = 0; i < 12; i += 1) {
        await sleep(500);
        const s = document.querySelectorAll('video');
        const live = [...s].filter((x) => x.readyState > 0 && !x.paused).length;
        if (live) break;
    }
    out.after = vids.slice(0, 3).map((x) => ({
        rs: x.readyState, nw: x.videoWidth, paused: x.paused, t: Math.round(x.currentTime * 10) / 10,
        err: x.error ? x.error.code : null,
    }));
    out.isPlayingAfter = !!(v.multiCameraPlayer && v.multiCameraPlayer.isPlaying);
    return JSON.stringify(out);
})()

(() => {
    const mp = viewer.multiCameraPlayer;
    window.__pl = window.__pl || [];
    if (!mp.__hooked) {
        let v = mp.isPlaying;
        Object.defineProperty(mp, 'isPlaying', {
            configurable: true,
            get: () => v,
            set: (n) => {
                if (v && !n) window.__pl.push(new Error('pause').stack.split(String.fromCharCode(10)).slice(1, 6).join(' <- '));
                v = n;
            }
        });
        mp.__hooked = 1;
    }
    return JSON.stringify({ hooked: true, mp: mp.isPlaying });
})()

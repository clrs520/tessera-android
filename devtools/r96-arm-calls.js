// Install a logger on the two transport calls that decide whether the picture moves, so the answer to
// 「谁在用户按了暂停之后又把它播起来了」 is a stack, not a guess. The page is reloaded by `stopApp`-style
// paths rarely, so the wrappers live as own properties on the player and die with the WebView.
(async () => {
    const m = window.viewer.multiCameraPlayer;
    if (window.__r96calls) return 'already armed';
    window.__r96calls = [];
    const t0 = Date.now();
    ['playAll', 'pauseAll'].forEach((name) => {
        const real = m[name].bind(m);
        m[name] = function (...a) {
            const f = m.players.front;
            const stack = (new Error().stack || '').split('\n').slice(2, 6)
                .map(s => s.trim().replace(/^at\s+/, '').replace(/\s*\(.*?script\.js:(\d+):\d+\)/, ':$1'))
                .join(' < ');
            window.__r96calls.push(`+${Date.now() - t0}ms ${name}() flag=${m.isPlaying}`
                + ` front=${f ? (f.paused ? 'paused' : 'running') : 'gone'} src=${f && f.src ? 'set' : 'EMPTY'}`
                + `\n      ${stack}`);
            return real(...a);
        };
    });
    return 'armed';
})();

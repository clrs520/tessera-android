// The speed control and its picker rows, in CSS px, so a real adb tap can hit the 8.0x row.
(() => {
    const sc = document.querySelector('.speed-control');
    const btn = sc && (sc.querySelector('button') || sc);
    const rows = [...document.querySelectorAll('.speed-options div')].map(d => {
        const r = d.getBoundingClientRect();
        return { t: d.textContent.trim(), x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), shown: r.height > 0 };
    });
    return JSON.stringify({
        control: sc ? { cls: sc.className, x: Math.round(btn.getBoundingClientRect().x + btn.getBoundingClientRect().width / 2), y: Math.round(btn.getBoundingClientRect().y + btn.getBoundingClientRect().height / 2) } : null,
        rows,
        rates: [...document.querySelectorAll('#videoPlayer, .video-container video')].map(v => v.playbackRate),
    }, null, 1);
})();

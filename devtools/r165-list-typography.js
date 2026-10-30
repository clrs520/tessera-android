(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const sidebar = document.querySelector('.sidebar');
    if (sidebar.classList.contains('collapsed')) {
        v.toggleSidebar(true);
        for (let i = 0; i < 30 && Math.abs(sidebar.getBoundingClientRect().left) > 0.5; i += 1) await sleep(100);
    }
    await sleep(400);
    const box = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
    const cards = Array.from(document.querySelectorAll('#fileList .video-card')).slice(0, 10);
    return JSON.stringify({
        viewport: [innerWidth, innerHeight],
        cards: cards.map((c) => {
            const info = c.querySelector('.video-info');
            const time = c.querySelector('.video-time');
            const sub = c.querySelector('.video-sub');
            const thumb = c.querySelector('.video-thumbnail');
            const cs = (el) => getComputedStyle(el);
            return {
                text: time ? time.innerText.replace(/\s+/g, ' ').trim() : null,
                sub: sub ? sub.innerText.replace(/\s+/g, ' ').trim() : null,
                card: box(c), thumb: thumb ? box(thumb) : null, info: info ? box(info) : null,
                timeBox: time ? box(time) : null, subBox: sub ? box(sub) : null,
                style: info ? {
                    display: cs(info).display, align: cs(info).textAlign, justify: cs(info).justifyContent,
                    alignItems: cs(info).alignItems, direction: cs(info).flexDirection,
                    fontSize: cs(time).fontSize, lineHeight: cs(time).lineHeight,
                    whiteSpace: cs(time).whiteSpace, overflow: cs(time).overflow,
                    overflowWrap: cs(time).overflowWrap, wordBreak: cs(time).wordBreak,
                } : null,
            };
        }),
    });
})()

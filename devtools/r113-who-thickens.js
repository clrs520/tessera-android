// R113 取证：真机是「先半透明、很快变白底」，AVD 深色主题下量不出来。
// 这一支按 100ms 采「面上的 alpha / glassState 那两组 / src / 视频那几路的可测性」，
// 目的只有一个：定死是谁在什么时候把它推厚的（video→css？还是某次 mount？）。
(async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const html = document.documentElement;
    const rows = [];
    const t0 = Date.now();
    for (let i = 0; i < 110; i++) {
        const bar = document.querySelector('.phone-action-bar');
        const pnl = document.querySelector('.header-collapsed .header-actions-group');
        rows.push({
            t: Date.now() - t0,
            css: getComputedStyle(html).getPropertyValue('--lens-alpha').trim(),
            a: +glassState.alpha.toFixed(3),
            want: +glassState.target.toFixed(3),
            src: glassState.src,
            luma: glassState.luma,
            cells: glassState.cells,
            solved: glassState.solved,
            mounts: glassState.mounts,
            rel: glassState.releasingGlass ? 1 : 0,
            hold: glassState.thinGlass ? Math.min(9999, Date.now() - glassState.thinGlass) : 0,
            lens: document.querySelectorAll('.lens-on').length,
            pnlOn: pnl ? pnl.classList.contains('lens-on') : null,
            barBg: bar ? getComputedStyle(bar).backgroundColor : '',
            open: document.getElementById('headerRight').classList.contains('active'),
            vis: [...document.querySelectorAll('.video-container')]
                .filter((x) => getComputedStyle(x).display !== 'none' && !x.classList.contains('hidden'))
                .map((x) => { const v = x.querySelector('video'); return v ? ((v.videoWidth ? 1 : 0) + '' + (v.readyState || 0) + (v.paused ? 'p' : '')) : '-'; }).join(' '),
        });
        await sleep(100);
    }
    // 折叠成「只在变化时记一行」，否则 110 行读不动
    const out = [];
    let prev = null;
    for (const r of rows) {
        const k = [r.css, r.a, r.want, r.src, r.luma, r.cells, r.solved, r.mounts, r.rel, r.lens, r.pnlOn, r.open, r.vis].join('|');
        if (k !== prev) { out.push(r); prev = k; }
    }
    return JSON.stringify({
        theme: (document.querySelector('.container') || {}).className || '(无)',
        total: rows.length, changed: out.length,
        srcCounts: rows.reduce((m, r) => (m[r.src] = (m[r.src] || 0) + 1, m), {}),
        alphaRange: [Math.min(...rows.map((r) => r.a)), Math.max(...rows.map((r) => r.a))],
        rows: out,
    }, null, 1);
})()

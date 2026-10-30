// R141: the landscape split follows the composite's aspect.
// 1/4-view plans are near 3:2 / 16:10 and stay at 1.6:1; 2/3/5/6-view plans are 2.3–4.6:1
// strips and take the old 1:1 split, otherwise the narrower right column cuts their width.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v) return JSON.stringify({ error: 'no viewer' });
    if (innerWidth <= innerHeight) return JSON.stringify({ error: 'not landscape', vp: [innerWidth, innerHeight] });
    if (!v.currentEvent && (v.eventGroups || []).length) {
        const ev = (v.eventGroups || []).find((e) => !/RecentClips/i.test(String(e.eventId || ''))) || v.eventGroups[0];
        await Promise.race([v.playEvent(ev.eventId).catch(() => {}), sleep(15000)]);
        for (let i = 0; i < 30 && !(v.videoControls?.totalDuration > 0); i += 1) await sleep(300);
    }
    await v.showPhoneExportModal();
    const all = v.phoneExportCameras();
    const sets = [
        [1, ['front']],
        [2, ['front', 'back']],
        [3, ['front', 'back', 'left']],
        [4, ['front', 'back', 'left', 'right']],
        [5, all.slice(0, 5)],
        [6, all.slice()],
    ];
    const rows = [];
    for (const [n, cams] of sets) {
        v.peSelection.cameras = cams.slice();
        v.renderPhoneExportPanel();
        const plan = v.phoneExportPlan();
        let cv = null;
        for (let i = 0; i < 12; i += 1) {
            await sleep(200);
            const c = document.querySelector('.pe-preview');
            if (!c) break;
            const b = c.getBoundingClientRect();
            cv = { w: b.width, h: b.height, nw: c.width, nh: c.height };
            if (plan.width && plan.height && b.height > 0
                && Math.abs((b.width / b.height) - (c.width / c.height)) < 0.03) break;
        }
        const p = document.querySelector('.phone-export-panel');
        const cols = getComputedStyle(p).gridTemplateColumns.split(' ').map(parseFloat);
        rows.push({
            n,
            planRatio: plan.width && plan.height ? +(plan.width / plan.height).toFixed(3) : null,
            wide: p.classList.contains('pe-wide-preview'),
            cols: cols.map((x) => Math.round(x)),
            split: +(cols[0] / cols[1]).toFixed(2),
            canvas: cv ? [Math.round(cv.w), Math.round(cv.h)] : null,
            ratio: cv && cv.h ? +(cv.w / cv.h).toFixed(3) : null,
            nat: cv && cv.nh ? +(cv.nw / cv.nh).toFixed(3) : null,
        });
    }
    // Restore the single-view state so the next suite starts from the approved layout.
    v.peSelection.cameras = [all.includes('front') ? 'front' : all[0]];
    v.renderPhoneExportPanel();
    await sleep(300);

    const byN = Object.fromEntries(rows.map((r) => [r.n, r]));
    const narrow = [1, 4].every((n) => byN[n] && !byN[n].wide
        && Math.abs(byN[n].split - 1.6) <= 0.03 && byN[n].canvas && byN[n].canvas[1] >= 160);
    const wide = [2, 3, 5, 6].every((n) => byN[n] && byN[n].wide
        && Math.abs(byN[n].split - 1) <= 0.03 && byN[n].canvas && byN[n].canvas[0] >= 380);
    // A 1px border / rounded CSS pixel dominates the ratio of a 68px-tall strip; allow 2% there,
    // while the 160px-tall plans keep the tight 0.04 tolerance.
    const ratioOk = rows.every((r) => !r.canvas
        || (r.nat && Math.abs(r.ratio - r.nat) <= Math.max(0.04, r.nat * 0.02)));
    const needed = {
        2: (r) => r.canvas && r.canvas[1] >= 130,
        3: (r) => r.canvas && r.canvas[1] >= 88,
        5: (r) => r.canvas && r.canvas[1] >= 160,
        6: (r) => r.canvas && r.canvas[1] >= 160,
    };
    const sizes = Object.entries(needed).every(([n, fn]) => byN[n] && fn(byN[n]));
    return JSON.stringify({
        pass: [narrow, wide, ratioOk, sizes].filter(Boolean).length,
        total: 4,
        checks: {
            narrow: `1/4 路保持 1.6:1 且高度 ≥160: ${narrow}`,
            wide: `2/3/5/6 路切 1:1 且宽 ≥380: ${wide}`,
            ratio: `所有画面的显示比例=固有比例: ${ratioOk}`,
            sizes: `2/3/5/6 没有比 1.6 版更小: ${sizes}`,
        },
        rows,
    });
})()

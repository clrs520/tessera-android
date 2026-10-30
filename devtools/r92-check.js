// R92 acceptance, preview side: the speed column keeps its reserved width (so nothing on the line
// slides sideways) but the digits now sit against its right edge, so the unit is one space from the
// last digit whatever the reading says. Painted through the app's own `pePaintPreviewWatermark` — the
// same function the pinned preview and the zoom layer use — and measured off the ink, not off the
// arithmetic that produced it.
(async () => {
    const v = viewer;
    const SPEEDS = ['5.6', '9.4', '15.6', '42.8', '104.7'];
    const CLOCK = '2026-10-09 10:00:00';
    const canvas = document.createElement('canvas');
    canvas.width = 1104; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const saved = v.phoneExportCaptions;
    const checks = [];
    try {
        SPEEDS.forEach((spd) => {
            v.phoneExportCaptions = () => [{ us: 0, clk: CLOCK, spd, st: '', gps: '', src: '', bar: -1 }];
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const rect = v.pePaintPreviewWatermark(ctx, canvas, null, 0.25, 0);
            if (!rect) { checks.push({ spd, fatal: 'painted nothing' }); return; }
            // Integer geometry: `rect` comes back fractional, and indexing a pixel buffer with a
            // float stride reads the wrong bytes and finds no ink at all.
            const bx = Math.round(rect.x), by = Math.round(rect.y);
            const bw = Math.max(1, Math.round(rect.w)), bh = Math.max(1, Math.round(rect.h));
            const data = ctx.getImageData(bx, by, bw, bh).data;
            const luma = (x, y) => {
                const i = (y * bw + x) * 4;
                return (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
            };
            // The number is the only *tall* ink on the line: the clock is 0.59× and the unit 0.43×
            // its size, so a per-column vertical extent separates them without guessing at gaps —
            // grouping by whitespace cannot, because the whole point is that the unit sits close.
            const speedPx = 0.032 * canvas.height * v.peSelection.overlay.scale;
            const tall = [];
            const any = [];
            for (let x = 0; x < bw; x += 1) {
                let top = -1, bottom = -1, hit = 0;
                for (let y = 0; y < bh; y += 1) {
                    if (luma(x, y) >= 150) { if (top < 0) top = y; bottom = y; hit += 1; }
                }
                any.push(hit);
                tall.push(hit && (bottom - top + 1) >= speedPx * 0.7);
            }
            let nL = -1, nR = -1;
            tall.forEach((isTall, x) => {
                if (!isTall) return;
                if (nL < 0) nL = x;
                nR = x;
            });
            let unitL = -1;
            for (let x = nR + 1; x < bw; x += 1) if (any[x]) { unitL = x; break; }
            checks.push({
                spd,
                block: [bx, by, bw, bh],
                number: nL >= 0 ? [bx + nL, bx + nR] : null,
                unitLeft: unitL >= 0 ? bx + unitL : null,
                gap: nL >= 0 && unitL >= 0 ? unitL - nR - 1 : null,
            });
        });
    } finally {
        v.phoneExportCaptions = saved;
    }
    const ok = checks.filter((c) => Number.isFinite(c.gap));
    const gaps = ok.map((c) => c.gap);
    const rights = ok.map((c) => c.number[1]);
    const lefts = ok.map((c) => c.number[0]);
    const blocks = ok.map((c) => c.block[2]);
    const enough = ok.length === SPEEDS.length;
    return JSON.stringify({
        checks,
        gapMin: enough ? Math.min(...gaps) : null, gapMax: enough ? Math.max(...gaps) : null,
        rightMin: enough ? Math.min(...rights) : null, rightMax: enough ? Math.max(...rights) : null,
        leftMin: enough ? Math.min(...lefts) : null, leftMax: enough ? Math.max(...lefts) : null,
        blockWMin: enough ? Math.min(...blocks) : null,
        blockWMax: enough ? Math.max(...blocks) : null,
        verdict: {
            '五个读数全部量到（探针没瞎）': enough,
            '间隙不再随读数变（≤ 2px）': enough
                && Math.max(...gaps) - Math.min(...gaps) <= 2,
            '间隙紧（≤ 12px）': enough && Math.max(...gaps) <= 12,
            // A right-aligned column: the digits' right edge is pinned (a few px of glyph-shape
            // noise at the ink boundary is expected — "7" ends inside its advance, "6" does not),
            // and the left edge is what moves. Before this it was exactly the other way round.
            '数字右沿钉住（≤ 6px）': enough
                && Math.max(...rights) - Math.min(...rights) <= 6,
            '数字左沿确实会走（右对齐的签名）': enough
                && Math.max(...lefts) - Math.min(...lefts) >= 12,
            '整块宽度仍按锁定格（没有横移）': enough
                && Math.max(...blocks) - Math.min(...blocks) <= 1,
        },
    });
})()

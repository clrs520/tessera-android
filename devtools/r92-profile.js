// R92: the gap probe came back 0 px, which is either "tight and right" or "the unit is touching the
// digits". This dumps the per-column ink of the main row for two readings so the whitespace between
// the number and the unit can be counted, not inferred.
(async () => {
    const v = viewer;
    const canvas = document.createElement('canvas');
    canvas.width = 1104; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const saved = v.phoneExportCaptions;
    const rows = [];
    try {
        ['5.6', '104.7'].forEach((spd) => {
            v.phoneExportCaptions = () => [{ us: 0, clk: '2026-10-09 10:00:00', spd,
                st: '', gps: '', src: '', bar: -1 }];
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const rect = v.pePaintPreviewWatermark(ctx, canvas, null, 0.25, 0);
            const bw = Math.round(rect.w), bh = Math.round(rect.h);
            const data = ctx.getImageData(Math.round(rect.x), Math.round(rect.y), bw, bh).data;
            const col = (x) => {
                let best = 0, extent = 0, top = -1, bottom = -1;
                for (let y = 0; y < bh; y += 1) {
                    const i = (y * bw + x) * 4;
                    const l = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
                    if (l > best) best = l;
                    if (l >= 150) { if (top < 0) top = y; bottom = y; }
                }
                extent = top < 0 ? 0 : bottom - top + 1;
                return { l: Math.round(best), e: extent };
            };
            // The number ends somewhere in the last third of the block; print from there to the end.
            const from = Math.round(bw * 0.55);
            const line = [];
            for (let x = from; x < bw; x += 1) {
                const c = col(x);
                line.push(`${x - from}:${c.l}${c.e >= 16 ? 'T' : ''}${c.e > 0 && c.e < 16 ? '.' : ''}`);
            }
            rows.push({ spd, block: [Math.round(rect.x), Math.round(rect.y), bw, bh],
                from, profile: line.join(' ') });
        });
    } finally {
        v.phoneExportCaptions = saved;
    }
    return JSON.stringify(rows);
})()

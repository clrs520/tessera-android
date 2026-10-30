// R86 A/B baseline. The export path must keep doing what it already does for un-rotated clips and
// for multi-cell layouts; only the double turn should change. Fingerprints are taken from the
// thumbnail the app itself produces, cropped to the painted content so a letterbox or a pillarbox
// cannot fake a match. Run before the install and again after, and compare.
(async () => {
    const N = 16;
    const TAKE = 3000000;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { runs: [] };

    const nativeThumb = (path, millis, width) => new Promise((resolve) => {
        const id = `r86b${Math.random().toString(36).slice(2, 7)}`;
        const previous = window.__tdashcamNativeThumb;
        let done = false;
        window.__tdashcamNativeThumb = (got, dataUrl) => {
            if (previous) previous(got, dataUrl);
            if (got === id && !done) { done = true; resolve(typeof dataUrl === 'string' ? dataUrl : null); }
        };
        setTimeout(() => { if (!done) { done = true; resolve(null); } }, 25000);
        window.TDashcamNative.requestThumb(id, path, millis, width);
    });

    // Coarse luma grid, after trimming the black border a contained picture leaves inside its cell.
    const gridOf = (src, crop) => new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            let left = 0, top = 0, right = canvas.width - 1, bottom = canvas.height - 1;
            if (crop) {
                const scan = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const lit = (x, y) => {
                    const i = (y * canvas.width + x) * 4;
                    return scan[i] + scan[i + 1] + scan[i + 2] > 24;
                };
                const colLit = (x) => { for (let y = 0; y < canvas.height; y += 2) if (lit(x, y)) return true; return false; };
                const rowLit = (y) => { for (let x = 0; x < canvas.width; x += 2) if (lit(x, y)) return true; return false; };
                while (left < right && !colLit(left)) left += 1;
                while (right > left && !colLit(right)) right -= 1;
                while (top < bottom && !rowLit(top)) top += 1;
                while (bottom > top && !rowLit(bottom)) bottom -= 1;
            }
            const patch = ctx.getImageData(left, top, Math.max(1, right - left + 1), Math.max(1, bottom - top + 1));
            const cells = [];
            for (let r = 0; r < N; r += 1) {
                for (let c = 0; c < N; c += 1) {
                    const x = Math.min(patch.width - 1, Math.floor((c + 0.5) * patch.width / N));
                    const y = Math.min(patch.height - 1, Math.floor((r + 0.5) * patch.height / N));
                    const i = (y * patch.width + x) * 4;
                    const d = patch.data;
                    cells.push(Math.round((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000));
                }
            }
            resolve({ cells, dims: [image.naturalWidth, image.naturalHeight], box: [left, top, right, bottom] });
        };
        image.onerror = () => resolve(null);
        image.src = src;
    });
    const hex = (cells) => cells.map((v) => Math.min(15, v >> 4).toString(16)).join('');
    const meanAbs = (a, b) => +(a.reduce((sum, value, i) => sum + Math.abs(value - (b[i] ?? 0)), 0) / a.length).toFixed(2);

    const RECENT = '/storage/emulated/0/TeslaCam/RecentClips';
    const R86 = '/storage/emulated/0/TeslaCam/SavedClips/2026-10-17_11-30-00';
    const clip = (dir, stamp, name, offset) => ({
        path: `${dir}/${stamp}-${name}.mp4`,
        clipStartUs: offset || 0,
        clipEndUs: (offset || 0) + TAKE,
        globalStartUs: offset || 0,
    });
    const jobs = [
        {
            tag: 'single-rot0', width: 576, height: 1280, rows: 1, cols: 1,
            cameras: [{ camera: 'left_repeater', cell: 0, segments: [clip(R86, '2026-10-17_11-30-00', 'left_repeater')] }],
            sources: [`${R86}/2026-10-17_11-30-00-left_repeater.mp4`],
            cells: [[0, 1]],
        },
        {
            tag: 'single-rot90', width: 1280, height: 576, rows: 1, cols: 1,
            cameras: [{ camera: 'front', cell: 0, segments: [clip(R86, '2026-10-17_11-30-00', 'front')] }],
            sources: [`${R86}/2026-10-17_11-30-00-front.mp4`],
            cells: [[0, 1]],
        },
        {
            tag: 'grid-1x2-recent', width: 1280, height: 720, rows: 1, cols: 2,
            cameras: [
                { camera: 'front', cell: 0, segments: [clip(RECENT, '2026-10-08_09-00-00', 'front')] },
                { camera: 'back', cell: 1, segments: [clip(RECENT, '2026-10-08_09-00-00', 'back')] },
            ],
            sources: [`${RECENT}/2026-10-08_09-00-00-front.mp4`, `${RECENT}/2026-10-08_09-00-00-back.mp4`],
            cells: [[0, 0.5], [0.5, 1]],
        },
    ];

    for (const [index, job] of jobs.entries()) {
        const outPath = `/storage/emulated/0/Download/r86-ab-${job.tag}.mp4`;
        const record = { tag: job.tag, canvas: `${job.width}x${job.height}` };
        const request = {
            id: 86100 + index, outPath, width: job.width, height: job.height,
            fps: 30, durationUs: TAKE, rows: job.rows, cols: job.cols, preferHardware: true,
            cameras: job.cameras,
        };
        let last = null;
        const previousProgress = window.__tdashcamExportProgress;
        window.__tdashcamExportProgress = (payload) => {
            previousProgress?.(payload);
            if (payload && payload.id === request.id) last = payload.phase;
        };
        window.TDashcamNative.startExport(JSON.stringify(request));
        for (let i = 0; i < 180 && last !== 'done' && last !== 'error' && last !== 'cancelled'; i += 1) await sleep(1000);
        window.__tdashcamExportProgress = previousProgress;
        record.phase = last;
        if (last !== 'done') { out.runs.push(record); continue; }
        await sleep(1200);

        const exportedUrl = await nativeThumb(outPath, 1000, 320);
        record.exported = await gridOf(exportedUrl, true);
        record.exports = record.exports || [];
        if (!record.exported) { record.failed = 'no exported thumb'; out.runs.push(record); continue; }
        record.exportDims = record.exported.dims;

        // Each cell of the composite, cropped to its painted content, must still be the same
        // picture as that camera's own frame at the same second.
        for (const [cellIndex, [from, to]] of job.cells.entries()) {
            const canvas = document.createElement('canvas');
            const image = await new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = exportedUrl;
            });
            if (!image) continue;
            canvas.width = Math.max(1, Math.round(image.naturalWidth * (to - from)));
            canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image,
                Math.round(image.naturalWidth * from), 0, canvas.width, canvas.height,
                0, 0, canvas.width, canvas.height);
            const cellGrid = await gridOf(canvas.toDataURL('image/jpeg', 0.8), true);
            const sourceGrid = await gridOf(await nativeThumb(job.sources[cellIndex], 1000, 160), true);
            record.exports.push({
                cell: cellIndex,
                dims: cellGrid?.dims,
                againstSource: cellGrid && sourceGrid ? meanAbs(sourceGrid.cells, cellGrid.cells) : null,
                fingerprint: cellGrid ? hex(cellGrid.cells) : null,
            });
        }
        record.exportFingerprint = record.exported ? hex(record.exported.cells) : null;
        out.runs.push(record);
    }

    out.runs = out.runs.map((r) => ({
        ...r,
        exported: undefined,
    }));
    window.__r86ab = out;
    return JSON.stringify(out, null, 1);
})()

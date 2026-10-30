// R86 evidence: what orientation does the native retriever actually hand back for a clip whose
// rotation lives only in the tkhd matrix? Same file, three transforms, dims only — the coded
// samples are identical, so any difference in the returned bitmap is the metadata being honoured
// (or not) rather than a different picture.
(async () => {
    const out = { api: null, native: {}, checks: {} };
    const base = '/storage/emulated/0/Download/r86/';
    const files = { rot0: base + 'r86-rot0.mp4', rot90: base + 'r86-rot90.mp4', rot270: base + 'r86-rot270.mp4' };
    const WIDTH = 160;

    out.api = navigator.userAgent.match(/Android\s+([\d.]+)/)?.[1] || null;

    const capture = {};
    const original = window.__tdashcamNativeThumb;
    window.__tdashcamNativeThumb = (id, dataUrl) => {
        if (capture[id]) capture[id](typeof dataUrl === 'string' ? dataUrl : null);
        if (original) original(id, dataUrl);
    };

    const askNative = (path, millis) => new Promise((resolve) => {
        const id = `r86${Math.random().toString(36).slice(2, 8)}`;
        capture[id] = resolve;
        setTimeout(() => resolve(undefined), 20000);
        window.TDashcamNative.requestThumb(id, path, millis, WIDTH);
    });

    const dimsOf = (dataUrl) => new Promise((resolve) => {
        if (typeof dataUrl !== 'string') return resolve(null);
        const image = new Image();
        image.onload = () => resolve({ w: image.naturalWidth, h: image.naturalHeight, chars: dataUrl.length });
        image.onerror = () => resolve('decode-error');
        image.src = dataUrl;
    });

    for (const [name, path] of Object.entries(files)) {
        const url = await askNative(path, 1000);
        out.native[name] = await dimsOf(url === undefined ? null : url);
    }

    // A wide answer where the source is tall means the retriever turned the frame for us; a tall
    // answer means it handed back the coded samples and the picture is on its side.
    const tall = (d) => !!d && d.h > d.w;
    out.checks = {
        rot0IsTall: tall(out.native.rot0),
        rot90AlreadyTurned: !!out.native.rot90 && out.native.rot90.w > out.native.rot90.h,
        rot270AlreadyTurned: !!out.native.rot270 && out.native.rot270.w > out.native.rot270.h,
    };

    window.__tdashcamNativeThumb = original;
    return JSON.stringify(out, null, 1);
})()

// R157 — does the native walk still cut the folder short, and in what order does it spend its budget?
(async () => {
    const t = performance.now();
    const r = await nativeInvoke('scan_media_dir', { path: '/sdcard/TeslaCamBig' });
    const files = r.files || [];
    const rel = files.map(f => f.split('/').slice(2));
    const cats = [];
    for (const parts of rel) if (parts[0] && cats[cats.length - 1] !== parts[0]) cats.push(parts[0]);
    const firstPerCat = {};
    for (const parts of rel) if (!firstPerCat[parts[0]]) firstPerCat[parts[0]] = parts.slice(1).join('/');
    const savedEvents = [...new Set(rel.filter(p => p[0] === 'SavedClips').map(p => p[1]))];
    return JSON.stringify({
        ms: Math.round(performance.now() - t),
        files: files.length,
        truncated: !!r.truncated,
        cats,
        firstPerCat,
        savedEvents,
        recentFirst: rel[0] && rel[0].slice(0, 2),
        recentLast: rel.filter(p => p[0] === 'RecentClips').slice(-1)[0],
        measuredDurations: (r.durations || []).filter(d => d > 0).length,
    });
})()

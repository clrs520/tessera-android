// R191 — the frame cache is bounded by characters and evicts least-recently-used.
(async () => {
    const F = FrameFetcher;
    const key = F.key.bind(F);
    F.cache.clear(); F.cacheSizes.clear(); F.cacheBytes = 0;
    const chunk = 'x'.repeat(8000);           // ~8 KB, the size of a 320 px frame
    const out = {};

    // Fill exactly to the budget: 1 500 × 8 000 chars = 12 M.
    for (let i = 0; i < 1500; i++) F.remember(key(`p${i}`, 1, 320), chunk);
    out.full = { n: F.cache.size, chars: F.cacheBytes, cap: F.CACHE_CHARS };

    // Read the very first one: it becomes the most recent, so the next 200 insertions must evict
    // p1..p200 and leave p0 alone.
    const hit = await F.get('p0', 1, 320);
    out.hitWorks = typeof hit === 'string' && hit.length === 8000;
    for (let i = 1500; i < 1700; i++) F.remember(key(`p${i}`, 1, 320), chunk);

    out.after = { n: F.cache.size, chars: F.cacheBytes };
    out.touchedSurvived = F.cache.has(key('p0', 1, 320));
    out.unreadOldEvicted = !F.cache.has(key('p1', 1, 320));
    out.newestKept = F.cache.has(key('p1699', 1, 320));
    out.bounded = F.cacheBytes <= F.CACHE_CHARS;
    out.sizeMatchesLedger = [...F.cache.values()].reduce((s, v) => s + (typeof v === 'string' ? v.length : 0), 0) === F.cacheBytes;

    F.cache.clear(); F.cacheSizes.clear(); F.cacheBytes = 0;
    return JSON.stringify(out);
})()

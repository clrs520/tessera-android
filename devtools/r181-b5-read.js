// Poll the detached B5 windowing run. Prints the full report once it is done.
JSON.stringify((() => {
    const r = window.__b5;
    if (!r) return { missing: '还没有跑：node devtools/cdp-eval.mjs --file devtools/r181-b5-window.js' };
    if (r.running) return { running: true, ms: Math.round(performance.now() - r.t0),
        checks: (r.checks || []).length };
    return { passing: r.passing, failing: (r.failing || []).map((c) => c.name), err: r.err,
        pitch: r.pitch, atBottom: r.atBottom, back: r.back, atTop: r.atTop, endAgain: r.endAgain,
        checks: (r.checks || []).map((c) => `${c.ok ? '✓' : '✗'} ${c.name} — ${c.detail}`) };
})());

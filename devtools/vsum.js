// Generic one-line summariser for the verify suites: prints the tally and only the reds, so a run
// does not have to dump its whole sample ledger into the conversation.
//   node devtools/cdp-eval.mjs --file devtools/r180-verify.js | node devtools/vsum.js
let buf = '';
process.stdin.on('data', (d) => { buf += d; });
process.stdin.on('end', () => {
    const at = buf.indexOf('{');
    if (at < 0) return console.log('no json:', buf.slice(0, 200));
    let r;
    try {
        r = JSON.parse(buf.slice(at));
    } catch (e) {
        return console.log('parse failed', e.message, buf.slice(0, 300));
    }
    const checks = r.checks || [];
    const ok = checks.filter((c) => c.ok).length;
    const bad = (r.failing && r.failing.length ? r.failing : checks.filter((c) => !c.ok));
    console.log(JSON.stringify({
        orient: r.orient, view: r.view,
        pass: r.passing !== undefined ? r.passing : ok,
        fail: r.failing !== undefined ? (r.failing.length || (r.failingCount !== undefined ? r.failingCount : bad.length))
            : bad.length,
        reds: bad.map((c) => `${c.name} — ${c.detail}`),
        tally: r.tally ? Object.keys(r.tally).reduce((m, k) => {
            const v = r.tally[k];
            m[k] = typeof v === 'object' ? `${v.t0 !== undefined ? v.t0.rows : ''}` : v;
            return m;
        }, {}) : undefined,
        err: r.err,
    }, null, 1));
});

let buf = '';
process.stdin.on('data', d => { buf += d; });
process.stdin.on('end', () => {
    const at = buf.indexOf('{');
    if (at < 0) return console.log('no json:', buf.slice(0, 200));
    try {
        const r = JSON.parse(buf.slice(at));
        console.log(JSON.stringify({
            orient: r.orient, dpr: r.dpr,
            pass: (r.pass || []).length,
            failed: (r.fail || []).length,
            fail: r.fail, cost: r.cost,
        }, null, 1));
    } catch (e) {
        console.log('parse failed', e.message, buf.slice(0, 300));
    }
});

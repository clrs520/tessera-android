// Summarise { pass, fail, failures[] } suites (r171/r173 shape).
let buf = '';
process.stdin.on('data', (d) => { buf += d; });
process.stdin.on('end', () => {
    const at = buf.indexOf('{');
    if (at < 0) return console.log('no json:', buf.slice(0, 200));
    const j = JSON.parse(buf.slice(at));
    console.log(JSON.stringify({ pass: j.pass, fail: j.fail, viewport: j.viewport,
        reds: (j.failures || []).map((f) => `${f.name} — ${f.detail}`) }, null, 1));
});

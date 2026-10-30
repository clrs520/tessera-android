// Reads the R92 gap probe's JSON on stdin and prints one line per variant. Nothing else.
let s = '';
process.stdin.on('data', (d) => { s += d; });
process.stdin.on('end', () => {
    let j;
    try { j = JSON.parse(s); } catch (e) { console.log('RAW ' + s.slice(0, 300)); return; }
    (j.cases || []).forEach((c) => {
        console.log(`帧高 ${c.frameH}  车速字号 ${c.speedPx}px  单位 ${c.unitPx}px`);
        Object.keys(c.gapPx).forEach((k) => {
            const g = c.gapPx[k];
            console.log(`   ${k.padEnd(11)} 数字到单位 ${String(g.min).padStart(5)}-${String(g.max).padStart(5)} px`
                + `  单位横移 ${String(c.unitX[k].jitter).padStart(5)} px`
                + `  数字左缘游走 ${c.digitLeftDrift[k]} px`);
        });
    });
});

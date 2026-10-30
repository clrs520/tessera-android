#!/usr/bin/env bash
# R88 regression sweep. R88 moved the export sheet's DOM around (one page, three panes), changed the
# overlay defaults (two new keys) and added a static layer to the export request, so everything
# downstream of the sheet, the defaults and the engine gets re-run rather than assumed intact.
# Each probe prints its own verdict line; this only sequences them and keeps the raw JSON.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p devtools/r88-regress
for probe in r83-verify r84-verify r85-verify2 r85-verify3 r87-ui; do
    echo "=== $probe"
    CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file "devtools/$probe.js" \
        > "devtools/r88-regress/$probe.json" 2>&1
    node -e "
const fs=require('fs');const raw=fs.readFileSync('devtools/r88-regress/$probe.json','utf8');
let j;try{j=JSON.parse(raw)}catch(e){console.log('  NON-JSON: '+raw.slice(0,300));process.exit(0)}
// Three generations of probe shape: {checks:[{pass}]}, {steps:{k:{ok}}}, and per-row geometry
// booleans. Reading only the first made the sweep print 'checks=0' for probes that had plenty to say.
const bad=new Set(); let n=0;
const walk=(o,p)=>{ if(!o||typeof o!=='object')return;
    if(Array.isArray(o)){ o.forEach((v,i)=>walk(v,p+'['+i+']')); return; }
    n+=1;
    for(const k of ['pass','ok','inside','centred','matchesTheFeed','shipped']) {
        if(o[k]===false) bad.add(p+(o.cam?' '+o.cam:'')+' '+k+'=false');
    }
    Object.entries(o).forEach(([k,v])=>{ if(k==='shipped')return; walk(v,p==='.'?k:p+'.'+k); });
};
walk(j,'.');
Object.entries(j.shipped||{}).forEach(([k,v])=>{ if(v!==true) bad.add('shipped.'+k+'='+v); });
(j.checks||[]).forEach(c=>{ if(c.pass===false||c.ok===false) bad.add(c.name||c.id||'?'); });
if(bad.size===0 && j.verdict && !/PASS/i.test(j.verdict)) bad.add('verdict='+j.verdict);
console.log('  verdict='+(j.verdict||(bad.size?bad.size+' FAILED':'(none)'))+' items='+n+' failed='+bad.size);
[...bad].slice(0,10).forEach(b=>console.log('  FAIL '+b));
"
done
echo "=== r20 grid (needs /storage/emulated/0/Download/r20-grid.mp4; that R20 export is long gone, so 'no such file' here is expected)"
CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file devtools/probe-r20-gridverify.mjs > devtools/r88-regress/r20-gridverify.txt 2>&1
tail -3 devtools/r88-regress/r20-gridverify.txt

#!/usr/bin/env bash
# R87 regression sweep: the watermark touched the export request, the overlay defaults and the export
# sheet's layout group, so everything downstream of those gets re-run rather than assumed intact.
# Each probe prints its own verdict line; this only sequences them and keeps the raw JSON.
set -uo pipefail
cd "$(dirname "$0")/.."
mkdir -p devtools/r87-regress
for probe in r83-verify r84-verify r85-verify2 r85-verify3; do
    echo "=== $probe"
    CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file "devtools/$probe.js" \
        > "devtools/r87-regress/$probe.json" 2>&1
    node -e "
const fs=require('fs');const raw=fs.readFileSync('devtools/r87-regress/$probe.json','utf8');
let j;try{j=JSON.parse(raw)}catch(e){console.log('  NON-JSON: '+raw.slice(0,200));process.exit(0)}
const bad=(j.checks||[]).filter(c=>c.ok===false||c.pass===false);
console.log('  verdict=' + (j.verdict || (bad.length?bad.length+' FAILED':'(no verdict field)')) + ' checks=' + (j.checks||[]).length + ' failed=' + bad.length);
bad.slice(0,6).forEach(c=>console.log('  FAIL ' + (c.name||c.id||'?') + ' ' + JSON.stringify(c).slice(0,180)));
"
done
echo "=== r20 grid"
CDP_TIMEOUT_MS=300000 node devtools/probe-r20-gridverify.mjs > devtools/r87-regress/r20-gridverify.txt 2>&1
tail -6 devtools/r87-regress/r20-gridverify.txt

#!/bin/bash
# R64-1 acceptance, mixed form: alternating real double taps on the picture's left and right thirds,
# i.e. 「多次双击画面前进或后退」. That is the worst case for reloading, because every pair aims at a
# different file and the retreat lands behind a forward carry (or vice versa).
# usage: devtools/r65-mixed.sh <pairs> [gapSeconds]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
N=${1:-6}; GAP=${2:-0.9}
Y=${Y:-197}
DPR=${DPR:-2.625}
LEFT=$(awk "BEGIN{printf \"%d\", 412 * $DPR + 0.5}")
RIGHT=$(awk "BEGIN{printf \"%d\", 502 * $DPR + 0.5}")
PY=$(awk "BEGIN{printf \"%d\", ($Y) * $DPR + 0.5}")

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

node devtools/cdp-eval.mjs --file devtools/p12.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p13.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p15.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p16.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/probe-r64-sum.js
node devtools/cdp-eval.mjs "window.__seeklog=[]; window.__taps=[]; window.__errs=[]; 'cleared'" >/dev/null

CMD=""
for i in $(seq 1 "$N"); do
    if [ $((i % 2)) = 1 ]; then X=$RIGHT; else X=$LEFT; fi
    CMD="${CMD}input tap ${X} ${PY}; input tap ${X} ${PY}; "
    if [ "$i" != "$N" ]; then CMD="${CMD}sleep $GAP; "; fi
done
echo "--- mixed burst: $N pairs (alternating -10/+10) gap ${GAP}s ---"
adb shell "$CMD"
sleep 10
node devtools/cdp-eval.mjs --file devtools/p14.js

#!/bin/bash
# R64-1 acceptance, burst form: N real double taps inside ONE adb round trip, so no node startup
# lands between them. GAP>0 spaces the pairs (a user taps again after seeing the chip, not after
# 150ms). Usage: devtools/r65-burst.sh <cssX> <cssY> <pairs> [gapSeconds]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
X=$1; Y=$2; N=${3:-6}; GAP=${4:-0}
DPR=${DPR:-2.625}
PX=$(awk "BEGIN{printf \"%d\", ($X) * $DPR + 0.5}")
PY=$(awk "BEGIN{printf \"%d\", ($Y) * $DPR + 0.5}")

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed (pid $PID)"; exit 1; }
FOCUS=$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')
[ "$FOCUS" = "1" ] || { echo "NOT FOCUSED (anr dialog / launcher?)"; exit 1; }

node devtools/cdp-eval.mjs --file devtools/p12.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p13.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p15.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p16.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/probe-r64-sum.js
node devtools/cdp-eval.mjs "window.__seeklog=[]; window.__taps=[]; window.__errs=[]; 'cleared'" >/dev/null

CMD=""
for i in $(seq 1 "$N"); do
    CMD="${CMD}input tap ${PX} ${PY}; input tap ${PX} ${PY}; "
    if [ "$i" != "$N" ]; then CMD="${CMD}sleep $GAP; "; fi
done
echo "--- burst: $N pairs gap ${GAP}s at css($X,$Y) px($PX,$PY) ---"
adb shell "$CMD"
sleep 10
node devtools/cdp-eval.mjs --file devtools/p14.js

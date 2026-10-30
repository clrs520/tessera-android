#!/bin/bash
# R64-1 acceptance: N real double taps at one x, sampling the front feed after each.
# usage: devtools/r65-loop.sh <cssX> <cssY> <n> [label]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
X=$1; Y=$2; N=$3; L=${4:-t}
PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed (pid $PID)"; exit 1; }
for i in $(seq 1 "$N"); do
    bash devtools/dbltap.sh "$X" "$Y" >/dev/null 2>&1
    printf '%s%s ' "$L" "$i"
    node devtools/cdp-eval.mjs --file devtools/probe-r64-advance.js 2>&1 | head -1
done

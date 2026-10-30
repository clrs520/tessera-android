#!/bin/bash
# R64-2 zone acceptance: three REAL double taps across the landscape width in one adb round trip —
# deep in the letterbox (x=100), the picture's left third (x=412) and its right third (x=502) — and
# then read which of them reached phoneSeekStep. Proves the band both excludes black and keeps the
# two ±10s zones reachable at >=44px each. Usage: devtools/r64-zone.sh [cssY]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
Y=${1:-197}
DPR=${DPR:-2.625}
PY=$(awk "BEGIN{printf \"%d\", ($Y) * $DPR + 0.5}")
T=$(awk "BEGIN{printf \"%d\", 100 * $DPR + 0.5}")
L=$(awk "BEGIN{printf \"%d\", 412 * $DPR + 0.5}")
R=$(awk "BEGIN{printf \"%d\", 502 * $DPR + 0.5}")

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

node devtools/cdp-eval.mjs "viewer.continuousPlayer.seekToTime(300); 'seek'" >/dev/null
sleep 4
node devtools/cdp-eval.mjs "viewer.continuousPlayer.multiCameraPlayer.playAll(); String(document.querySelector('#front-player').paused)" >/dev/null
sleep 2
node devtools/cdp-eval.mjs "window.__steps=[]; 'cleared'" >/dev/null 2>&1
node devtools/cdp-eval.mjs --file devtools/p21.js
echo "--- taps: letterbox(100) / left third(412) / right third(502) at y=$Y ---"
adb shell "input tap $T $PY; input tap $T $PY; sleep 1; input tap $L $PY; input tap $L $PY; sleep 1; input tap $R $PY; input tap $R $PY; screencap -p /sdcard/r64chip.png"
$ADB pull /sdcard/r64chip.png devtools/r64chip.png >/dev/null 2>&1
node devtools/cdp-eval.mjs --file devtools/p22.js

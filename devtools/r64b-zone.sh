#!/bin/bash
# R64-2 zone acceptance. Four REAL double taps, one second apart, at:
#   200  black letterbox left of the picture   -> must do nothing
#   412  left third of the painted picture     -> -10s, chip at-left on the picture
#   502  right third                           -> +10s, chip at-right on the picture
#   700  black letterbox right of the picture  -> must do nothing
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
Y=${Y:-197}
DPR=${DPR:-2.625}
PY=$(awk "BEGIN{printf \"%d\", ($Y) * $DPR + 0.5}")
A=$(awk "BEGIN{printf \"%d\", 200 * $DPR + 0.5}")
B=$(awk "BEGIN{printf \"%d\", 412 * $DPR + 0.5}")
C=$(awk "BEGIN{printf \"%d\", 502 * $DPR + 0.5}")
D=$(awk "BEGIN{printf \"%d\", 700 * $DPR + 0.5}")

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

# ⚠ Revision facts must be read BEFORE p12/p21/p23 install their wrappers: those replace the very
# methods the `.toString()` checks look at, so a later check reports false on shipped code.
node devtools/cdp-eval.mjs --file devtools/p27.js
node devtools/cdp-eval.mjs --file devtools/p12.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p15.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p21.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p23.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p25.js >/dev/null
node devtools/cdp-eval.mjs "window.__steps=[]; window.__chips=[]; window.__taps=[]; window.__seeklog=[]; window.__camSteps=[]; 'cleared'" >/dev/null
node devtools/cdp-eval.mjs "viewer.continuousPlayer.seekToTime(${SEEDCT:-300}); viewer.continuousPlayer.multiCameraPlayer.playAll(); 'seed300'" >/dev/null
sleep 5
node devtools/cdp-eval.mjs --file devtools/probe-r64-sum.js
echo "--- four real double taps: 200(black) 412(left) 502(right) 700(black), y=$Y ---"
adb shell "input tap $A $PY; input tap $A $PY; sleep 1; input tap $B $PY; input tap $B $PY; sleep 1; input tap $C $PY; input tap $C $PY; sleep 1; input tap $D $PY; input tap $D $PY; screencap -p /sdcard/r64chip.png"
$ADB pull /sdcard/r64chip.png devtools/r64chip-black-right.png >/dev/null 2>&1
node devtools/cdp-eval.mjs --file devtools/p24.js

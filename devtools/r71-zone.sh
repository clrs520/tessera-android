#!/bin/bash
# R64-2 landscape zone acceptance, on a timeline that is actually playing.
#
# Two things this has to get right that the older adb-`input tap` script could not:
#  * the pair must land inside the 340ms window (see dbltap.mjs), and
#  * the clip must not run out mid-test — the fixture is only 18.27s per file, so the nominal
#    558s timeline is retimed to 182.72s first (p29) and every tap is measured against a position
#    with ±10s of room left. When it was paused at the end, a 「−10 秒」 tap correctly reads as
#    「−1 帧」 and looks like a broken gesture.
#
# usage: SEED=100 devtools/r71-zone.sh
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export MSYS_NO_PATHCONV=1
Y=${Y:-197}
SEED=${SEED:-100}

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

E=$(awk "BEGIN{printf \"%d\", $Y * 2.625 + 0.5}")
node devtools/cdp-eval.mjs "viewer.continuousPlayer.seekToTime($SEED); viewer.multiCameraPlayer.playAll(); 'seeded'" >/dev/null
# A seek on this fixture needs ~8s to buffer (measured: readyState 1 for ten seconds after 「ended」),
# and a tap during that window is fine but the clip is not advancing, so give it room first.
sleep 8
node devtools/cdp-eval.mjs "window.__steps=[]; window.__chips=[]; window.__taps=[]; window.__seeklog=[]; window.__camSteps=[]; window.__lifts=[]; viewer.dom.playerArea.addEventListener('pointerup',e=>window.__lifts.push(Math.round(e.timeStamp)),true); JSON.stringify({ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),playing:viewer.multiCameraPlayer.isPlaying,paused:viewer.multiCameraPlayer.players.front.paused})"
node devtools/cdp-eval.mjs --file devtools/p35.js

echo "--- 200 (letterbox, must be inert) ---";  node devtools/dbltap.mjs 200 $Y 1
node devtools/cdp-eval.mjs "JSON.stringify({ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),steps:window.__steps.length})"
echo "--- 412 (left third, -10s) ---";          node devtools/dbltap.mjs 412 $Y 1
node devtools/cdp-eval.mjs "JSON.stringify({ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),steps:window.__steps.length,chips:window.__chips.length})"
echo "--- 502 (right third, +10s) + chip screenshot ---"
node devtools/dbltap.mjs 502 $Y 1 &
sleep 0.75; $ADB shell screencap -p /sdcard/r71chip.png; wait
$ADB pull /sdcard/r71chip.png devtools/r71-chip-landscape.png >/dev/null 2>&1
node devtools/cdp-eval.mjs "JSON.stringify({ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),steps:window.__steps.length})"
echo "--- 700 (letterbox, must be inert) ---";  node devtools/dbltap.mjs 700 $Y 1
node devtools/cdp-eval.mjs "JSON.stringify({ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),steps:window.__steps.length})"
echo "--- 457 (centre, camera step) ---";       node devtools/dbltap.mjs 457 $Y 1
sleep 3
node devtools/cdp-eval.mjs "JSON.stringify({cam:viewer.multiCameraPlayer.activeCamera,playing:viewer.multiCameraPlayer.isPlaying})"
node devtools/cdp-eval.mjs --file devtools/p36.js
node devtools/cdp-eval.mjs --file devtools/p24.js

#!/bin/bash
# R64-1 burst, timed properly: N real double taps on the right third, each pair landing inside the
# 340ms window (adb `input tap` cannot do that — its two lifts are 360-730ms apart, so the burst
# under-tests itself). Reports the clock the taps added up to, whether the feed ever stayed paused,
# and whether the picture actually advanced.
#
#   SEED=60 PAIRS=6 GAP=700 devtools/r71-burst.sh
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export MSYS_NO_PATHCONV=1
SEED=${SEED:-60}
X=${X:-502}
Y=${Y:-197}
PAIRS=${PAIRS:-6}
GAP=${GAP:-700}

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

node devtools/cdp-eval.mjs --file devtools/p12.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p15.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p16.js >/dev/null
node devtools/cdp-eval.mjs "viewer.continuousPlayer.seekToTime($SEED); viewer.multiCameraPlayer.playAll(); 'seeded'" >/dev/null
sleep 8
node devtools/cdp-eval.mjs "window.__seeklog=[]; window.__errs=[]; window.__lifts=[]; viewer.dom.playerArea.addEventListener('pointerup',e=>window.__lifts.push(Math.round(e.timeStamp)),true); JSON.stringify({seed:+viewer.continuousPlayer.getCurrentTime().toFixed(1),playing:viewer.multiCameraPlayer.isPlaying,rs:viewer.multiCameraPlayer.players.front.readyState})"
node devtools/dbltap.mjs $X $Y $PAIRS $GAP 40
node devtools/cdp-eval.mjs --file devtools/p14.js
node devtools/cdp-eval.mjs --file devtools/p37.js

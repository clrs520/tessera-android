#!/bin/bash
# One-shot fixture for R64-1 on the 10-segment / 18.27s-file event. The nominal timeline runs 3.28x
# faster than wall clock (60s booked per segment, 18.27s of file), so 「播完自动下一个」 used to carry
# the fixture off to another event between probe calls and every later tap was measured against the
# wrong clip. Auto-next is switched off here for that reason only.
# usage: devtools/r65-seed.sh [ct]   (default 300)
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
CT=${1:-300}
PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

node devtools/cdp-eval.mjs "localStorage.setItem('tdashcam.autoNext','0'); viewer.autoNextEnabled=false; 'autoNext off'"
T=$(node devtools/cdp-eval.mjs "String(viewer.continuousPlayer.totalDuration||0)")
case "$T" in
  5[0-9][0-9]*|55[0-9]*) ;;
  *) node devtools/cdp-eval.mjs "viewer.playEvent('TeslaCam/RecentClips'); 'kicked'"; sleep 11 ;;
esac
node devtools/cdp-eval.mjs "viewer.multiCameraPlayer.setLayout('single'); viewer.continuousPlayer.seekToTime($CT); 'seeded $CT'"
sleep 4
node devtools/cdp-eval.mjs "viewer.autoNextEnabled=false; String(1)" >/dev/null
node devtools/cdp-eval.mjs --file devtools/probe-r64-sum.js

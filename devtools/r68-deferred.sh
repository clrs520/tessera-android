#!/bin/bash
# R64-1c regression: in `single`, step through the cameras with real centre double taps and check that a
# feed which never got a `src` at the segment reload (deferred) comes up and keeps playing.
# Usage: devtools/r68-deferred.sh [cssX] [cssY] [pairs]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export MSYS_NO_PATHCONV=1
X=${1:-457}; Y=${2:-197}; N=${3:-4}
DPR=${DPR:-2.625}
PX=$(awk "BEGIN{printf \"%d\", ($X)*$DPR+0.5}")
PY=$(awk "BEGIN{printf \"%d\", ($Y)*$DPR+0.5}")
PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }
for i in $(seq 1 "$N"); do
    $ADB shell "input tap ${PX} ${PY}; input tap ${PX} ${PY}" >/dev/null
    sleep 2.5
    echo "--- after centre pair #$i ---"
    node devtools/cdp-eval.mjs --file devtools/p28.js
done

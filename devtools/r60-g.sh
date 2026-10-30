#!/usr/bin/env bash
# One real adb gesture followed by the readout, so no gesture is judged from a stale layout.
# usage: r60-g.sh swipe x1 y1 x2 y2 dur   |  r60-g.sh tap x y  |  r60-g.sh probe
set -e
ADB=${ADB:-/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}
cd "$(dirname "$0")/.."
case "$1" in
  swipe) shift; "$ADB" -s emulator-5554 shell input swipe "$@" ;;
  tap)   shift; "$ADB" -s emulator-5554 shell input tap "$@" ;;
esac
sleep 2
node devtools/cdp-eval.mjs --file devtools/r60-fb.js 2>/dev/null | tail -1

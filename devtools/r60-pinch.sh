#!/usr/bin/env bash
# A real two-finger pinch, injected pointer by pointer with `input motionevent`.
# CDP's synthesizePinchGesture delivers pointer events with an empty pointerType, which every phone
# recognizer here (correctly) refuses to read as a finger, so pinch2.mjs can no longer drive it.
# usage: r60-pinch.sh <cssX> <cssY> <spreadFactor> [steps]
set -e
ADB=${ADB:-/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}
DPR=${DPR:-2.625}
cd "$(dirname "$0")/.."
X=$(awk "BEGIN{printf \"%d\", $1*$DPR}")
Y=$(awk "BEGIN{printf \"%d\", $2*$DPR}")
F=$3
S=${4:-6}
HALF=$(awk "BEGIN{printf \"%d\", 90*$DPR}")
me() { "$ADB" -s emulator-5554 shell input motionevent "$@" >/dev/null; }
me DOWN $X $(awk "BEGIN{printf \"%d\", $Y-$HALF}") 0
me DOWN $X $(awk "BEGIN{printf \"%d\", $Y+$HALF}") 1
for i in $(seq 1 $S); do
  t=$(awk "BEGIN{printf \"%.3f\", $i/$S}")
  off=$(awk "BEGIN{printf \"%d\", $HALF*(1+($F-1)*$t)}")
  me MOVE $X $(awk "BEGIN{printf \"%d\", $Y-$off}") 0
  me MOVE $X $(awk "BEGIN{printf \"%d\", $Y+$off}") 1
done
END=$(awk "BEGIN{printf \"%d\", $HALF*$F}")
me UP $X $(awk "BEGIN{printf \"%d\", $Y-$END}") 0
me UP $X $(awk "BEGIN{printf \"%d\", $Y+$END}") 1
node devtools/cdp-eval.mjs --file devtools/r60-fb.js 2>/dev/null | tail -1

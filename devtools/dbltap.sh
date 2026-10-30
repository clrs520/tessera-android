#!/bin/bash
# Two real taps inside the double-tap window. One adb round trip keeps the gap under the 340ms
# pairing floor; two separate `adb shell` calls drift past it.
# usage: devtools/dbltap.sh <cssX> <cssY> [cssX2 cssY2]
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
px() { awk "BEGIN{printf \"%d\", ($1) * $DPR + 0.5}"; }
X1=$(px "$1"); Y1=$(px "$2")
X2=$(px "${3:-$1}"); Y2=$(px "${4:-$2}")
adb shell "input tap $X1 $Y1; input tap $X2 $Y2"

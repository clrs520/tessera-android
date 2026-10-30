#!/bin/bash
# Real tap through adb using CSS px (the only coordinate system the probes report), AVD dpr = 2.625.
# usage: devtools/tap.sh <cssX> <cssY>   |   devtools/tap.sh --swipe <x1> <y1> <x2> <y2> [ms]
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
px() { awk "BEGIN{printf \"%d\", ($1) * $DPR + 0.5}"; }
if [ "$1" = "--swipe" ]; then
    shift
    adb shell input swipe "$(px "$1")" "$(px "$2")" "$(px "$3")" "$(px "$4")" "${5:-600}"
else
    adb shell input tap "$(px "$1")" "$(px "$2")"
fi

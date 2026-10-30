#!/bin/bash
# R64-1: a run of real double taps. Each pair is one adb round trip (two separate `adb shell` calls
# drift past the 340ms pairing floor); the gap between pairs clears `suppressPlayerTapUntil` but stays
# short enough that a seek still lands while the previous reload is running, which is the case that
# used to strand the picture.
# usage: devtools/r64-manytaps.sh <cssX> <cssY> [count] [gapMs]
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
HERE=$(dirname "$0")
GAP_S=$(awk "BEGIN{printf \"%.2f\", ${4:-600} / 1000}")
for i in $(seq 1 "${3:-6}"); do
    bash "$HERE/dbltap.sh" "$1" "$2"
    sleep "$GAP_S"
done
echo "TAPS_DONE=${3:-6}"

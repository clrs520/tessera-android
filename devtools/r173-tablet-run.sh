#!/usr/bin/env bash
# R173 · B7 — measure the event row at tablet geometry by resizing the emulator, then put the
# phone profile back. The reset runs even if the probe throws: leaving the AVD at 1600x2560 would
# silently re-tier every later suite (and the 94/0 baseline with it).
#   bash devtools/r173-tablet-run.sh [portrait|landscape]
set -u
ADB="${ADB:-/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
SERIAL="${ADB_SERIAL:-emulator-5554}"
MODE="${1:-portrait}"
cd "C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998"

reset_back() {
    "$ADB" -s "$SERIAL" shell wm size reset >/dev/null 2>&1
    "$ADB" -s "$SERIAL" shell wm density reset >/dev/null 2>&1
    "$ADB" -s "$SERIAL" shell settings put system user_rotation 0 >/dev/null 2>&1
    echo "  (已把模拟器还原成 1080x2400 / 420dpi)"
}
trap reset_back EXIT

# 1600x2560 at 320dpi = 800x1280 CSS px: coarse pointer, ≥769 wide, ≥501 tall → the tablet tier.
echo "== 平板档：wm size 1600x2560, density 320 → 800x1280 CSS ($MODE) =="
"$ADB" -s "$SERIAL" shell wm size 1600x2560
"$ADB" -s "$SERIAL" shell wm density 320
"$ADB" -s "$SERIAL" shell settings put system accelerometer_rotation 0 >/dev/null 2>&1
if [ "$MODE" = "landscape" ]; then
    "$ADB" -s "$SERIAL" shell settings put system user_rotation 0 >/dev/null 2>&1
    sleep 1
    "$ADB" -s "$SERIAL" shell settings put system user_rotation 1 >/dev/null 2>&1
fi
"$ADB" -s "$SERIAL" shell am force-stop com.tdashcam.studio
"$ADB" -s "$SERIAL" shell am start -W -n com.tdashcam.studio/.MainActivity >/dev/null 2>&1
sleep 15
CDP_TIMEOUT_MS=200000 node devtools/cdp-eval.mjs --file devtools/r173-tablet.js

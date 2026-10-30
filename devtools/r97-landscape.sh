#!/bin/bash
# Rotate the emulator, run the landscape-only assertions (the funnel exists nowhere else), rotate back.
# Auto-rotate is switched off around the run so the sensor cannot fight the explicit rotation.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID="${PID:-$("$ADB" shell pidof com.tdashcam.studio | tr -d '\r')}"
cd "$ROOT"

"$ADB" shell settings put system accelerometer_rotation 0
"$ADB" shell settings put system user_rotation 1
sleep 3
echo "--- landscape ---"
CDP_PID="$PID" CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs --file devtools/r97-verify-landscape.js
"$ADB" shell settings put system user_rotation 0
sleep 2
"$ADB" shell settings put system accelerometer_rotation 1
echo "--- back to portrait ---"
CDP_PID="$PID" CDP_TIMEOUT_MS=60000 node devtools/cdp-eval.mjs \
  'JSON.stringify({ w: innerWidth, h: innerHeight })'

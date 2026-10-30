#!/bin/bash
# Rotate the AVD to landscape, make sure the ⋮ panel is really open, run one probe file, rotate back.
# Auto-rotate is switched off around the run so the sensor cannot fight the explicit rotation.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROBE="${1:?usage: r99-land.sh <devtools/probe.js>}"
cd "$ROOT"
PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
if [ -z "$PID" ]; then
  MSYS_NO_PATHCONV=1 "$ADB" shell am start -n com.tdashcam.studio/.MainActivity >/dev/null
  sleep 26
  PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
fi
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 0
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 1
sleep 5
CDP_PID="$PID" CDP_TIMEOUT_MS=180000 node devtools/cdp-eval.mjs --file "$PROBE"
RC=$?
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 0
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 1
exit $RC

#!/usr/bin/env bash
# R88 export run: clear logcat, drive the two exports through CDP, then collect the engine's own
# account of what it built (TdExportChrome) next to the pixel measurements.
set -uo pipefail
cd "$(dirname "$0")/.."
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
PID=$($ADB -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
if [ -z "$PID" ]; then echo "app is not running"; exit 1; fi
$ADB -s emulator-5554 forward --remove-all >/dev/null 2>&1
$ADB -s emulator-5554 forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null
$ADB -s emulator-5554 logcat -c
CDP_PID=$PID CDP_TIMEOUT_MS=900000 node devtools/cdp-eval.mjs --file devtools/r88-export.js \
    > devtools/r88-export-132.json 2>&1
echo "probe exit=$?"
$ADB -s emulator-5554 logcat -d 2>/dev/null | grep -E "TdExportChrome|TdExportCaption|export failed|chrome requested" \
    | tail -25 > devtools/r88-logcat.txt
echo "=== engine lines"
cat devtools/r88-logcat.txt

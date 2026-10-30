#!/bin/bash
# R64 acceptance helper: wait for a build whose APK is strictly newer than the JS it ships, so an old
# background notification can never be read as 「build done」. Usage: devtools/wait-apk.sh [timeoutSeconds]
set -u
cd "$(dirname "$0")/.."
APK=TDashcamStudio/src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk
SRC=TDashcamStudio/src/script.js
DEADLINE=$(( $(date +%s) + ${1:-600} ))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    if [ -f "$APK" ] && [ "$APK" -nt "$SRC" ]; then
        # …and not still being written: size must hold for one second.
        A=$(stat -c %s "$APK"); sleep 1; B=$(stat -c %s "$APK")
        if [ "$A" = "$B" ]; then
            echo "APK_READY $(date -r "$APK" +%H:%M:%S) $B bytes"; exit 0
        fi
    fi
    sleep 5
done
echo "TIMEOUT"; exit 1

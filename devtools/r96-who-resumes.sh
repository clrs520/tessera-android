#!/bin/bash
# Arm the play/pause call logger, land the same two real fingers that reproduced the swallowed pause
# (下一条, then 暂停 500 ms later), wait out the window, and print every transport call with its stack.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID="${PID:-$(("$ADB" shell pidof com.tdashcam.studio) | tr -d '\r')}"
NEXT_X="${NEXT_X:-583}"
PAUSE_X="${PAUSE_X:-205}"
TAP_Y="${TAP_Y:-2024}"
cd "$ROOT"

echo ">>> arm"
CDP_PID="$PID" CDP_TIMEOUT_MS=30000 node devtools/cdp-eval.mjs --file devtools/r96-arm-calls.js

sleep 0.6
echo ">>> tap 下一条"
"$ADB" shell input tap "$NEXT_X" "$TAP_Y"
sleep 0.5
echo ">>> tap 暂停"
"$ADB" shell input tap "$PAUSE_X" "$TAP_Y"

sleep 6
echo '--- transport calls ---'
CDP_PID="$PID" CDP_TIMEOUT_MS=30000 node devtools/cdp-eval.mjs \
  '(window.__r96calls || []).join("\n") + "\ncount=" + (window.__r96calls || []).length + " flag=" + window.viewer.multiCameraPlayer.isPlaying + " front=" + (window.viewer.multiCameraPlayer.players.front || {}).paused'

#!/bin/bash
# Land two real fingers: 下一条, then 暂停 500 ms later (inside the reload window the new steppers
# create). The watcher prints only transitions, so read the lines, not the count.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
PID="${PID:-$(("$ADB" shell pidof com.tdashcam.studio) | tr -d '\r')}"
NEXT_X="${NEXT_X:-583}"
PAUSE_X="${PAUSE_X:-205}"
TAP_Y="${TAP_Y:-2024}"

(cd "$(dirname "$0")/.." && CDP_PID="$PID" CDP_TIMEOUT_MS=60000 node devtools/cdp-eval.mjs \
  --file devtools/r96-settle-watch.js > /tmp/r96-settle.out 2>&1) &
WATCH=$!
sleep 0.6
echo ">>> tap 下一条 at +600ms"
"$ADB" shell input tap "$NEXT_X" "$TAP_Y"
sleep 0.5
echo ">>> tap 暂停 at +1100ms"
"$ADB" shell input tap "$PAUSE_X" "$TAP_Y"
wait $WATCH
echo '--- transitions ---'
cat /tmp/r96-settle.out

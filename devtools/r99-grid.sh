#!/bin/bash
# R99-1 driver: rotate, open the ⋮ panel for real, read the five landscape grid variants, rotate back.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID="${PID:-$("$ADB" shell pidof com.tdashcam.studio | tr -d '\r')}"
cd "$ROOT"
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null

"$ADB" shell settings put system accelerometer_rotation 0
"$ADB" shell settings put system user_rotation 1
sleep 3

# Open it and wait for the panel to be *visibly* open (opacity 1), not merely `.active` — the closed
# panel is scaled to 0.98 and its class lies. R97 note; re-applied here verbatim. The nudge click has
# to be conditional: clicking once already opened it, and a second blind click closes it again.
CDP_PID="$PID" node devtools/cdp-eval.mjs '(async () => {
  const p = document.getElementById("headerActionsGroup");
  const open = () => document.getElementById("tabMoreBtn").click();
  const shown = () => +getComputedStyle(p).opacity === 1;
  open();
  for (let i = 0; i < 40 && !shown(); i++) {
    await new Promise(r => setTimeout(r, 200));
    if (i % 10 === 9 && !document.querySelector(".header-right").classList.contains("active")) open();
  }
  return JSON.stringify({ vis: getComputedStyle(p).visibility, op: getComputedStyle(p).opacity, w: innerWidth, h: innerHeight });
})()'

echo "--- grid variants ---"
CDP_PID="$PID" CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs --file devtools/r99-grid-variants.js

"$ADB" shell settings put system user_rotation 0
sleep 2
"$ADB" shell settings put system accelerometer_rotation 1
echo "--- back to portrait ---"

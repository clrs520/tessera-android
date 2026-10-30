#!/bin/bash
# R99 delivery driver: install the freshly built APK, cold start, then measure both orientations for
# real — portrait suite, rotate, landscape suite — catching a screenshot of each surface on the way.
# Rotation goes through an explicit `user_rotation` with auto-rotate off, because the sensor otherwise
# fights the run and a suite calibrated upright reports three extra failures sideways (R93 note).
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ADB_WIN="${ADB_WIN:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# A Windows-style path, deliberately: `MSYS_NO_PATHCONV=1` stops Git Bash from rewriting arguments, so
# handing adb a `/c/Users/...` path makes it fail to stat a file that plainly exists — and the driver
# then measures whatever old version is still installed and reports it as the new one.
VERSION="$(node -p 'require("./TDashcamStudio/src-tauri/tauri.conf.json").version')"
APK="${APK:-C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/Tessera-${VERSION}.apk}"
cd "$ROOT"

echo "--- install ---"
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 install -r -g "$APK" | tail -2
# Never measure an app the installer did not replace: `adb install` prints a failure and keeps going.
INSTALLED=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell dumpsys package com.tdashcam.studio | tr -d '\r' | grep -m1 -o 'versionName=[0-9.]*')
echo "  installed $INSTALLED  (expected versionName=$VERSION)"
case "$INSTALLED" in
  *"=$VERSION") ;;
  *) echo "  ABORT: the device is not running the build under test"; exit 1 ;;
esac
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell am force-stop com.tdashcam.studio
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell am start -n com.tdashcam.studio/.MainActivity >/dev/null
# Cold start is 20-25 s on this AVD, and the scan coming back is only half of "ready": the first run of
# this driver measured a page where the player area was 0 px tall, the control row had no width and
# `--controls-h` had never been published, which reads as nineteen failures and is really no failures.
# Wait for the layout, not for the data.
for i in $(seq 1 30); do
  PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
  [ -n "$PID" ] && MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
  N=$(CDP_PID="$PID" node devtools/cdp-eval.mjs '(()=>{const v=window.viewer;if(!v)return"WAIT no viewer";const eh=(v.eventGroups||[]).length;return eh>0?`READY ev=${eh}`:`WAIT ev=${eh}`})()' 2>/dev/null | tr -d '\r')
  echo "  t=${i}s pid=$PID $N"
  [ "${N:0:5}" = "READY" ] && break
  sleep 4
done
echo "  settle: $N"
sleep 3

echo "--- open the player surface (the transport row only exists with an event) ---"
CDP_PID="$PID" node devtools/cdp-eval.mjs '(async()=>{const v=window.viewer;const sleep=ms=>new Promise(r=>setTimeout(r,ms));const ev=(v.eventGroups||[])[0];await v.playEvent(ev.eventId);for(let i=0;i<40&&!(document.getElementById("viewSwitcher").getBoundingClientRect().width>0);i++)await sleep(300);return JSON.stringify({switcherW:Math.round(document.getElementById("viewSwitcher").getBoundingClientRect().width),laneW:Math.round(document.querySelector(".controls-section").getBoundingClientRect().width)})})()'
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r99-portrait-controls.png

echo "--- portrait: open panel screenshot ---"
CDP_PID="$PID" node devtools/cdp-eval.mjs --file devtools/r99-open-panel.js
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r99-portrait-panel.png
CDP_PID="$PID" node devtools/cdp-eval.mjs 'document.getElementById("tabMoreBtn").click(); "closed"'

echo "--- shipped CSS really carries the R99 rules? (fetch; the CSSOM walk throws on tauri.localhost) ---"
CDP_PID="$PID" node devtools/cdp-eval.mjs '(async()=>{const t=await (await fetch("styles.css")).text();const want=["minmax(112px, 1fr)","lang-toggle-btn {\n        grid-column: span 2","gap: 1px","bottom: calc(var(--action-h) + 12px)","padding: 0 5px !important"];return JSON.stringify(Object.fromEntries(want.map(s=>[s.slice(0,26),t.includes(s)])))})()'

echo "--- portrait suite ---"
CDP_PID="$PID" CDP_TIMEOUT_MS=180000 node devtools/cdp-eval.mjs --file devtools/r99-verify.js > devtools/r99-portrait.json
node -e 'const r=require("./devtools/r99-portrait.json");console.log("portrait pass",r.pass,"fail",r.fail.length);r.fail.forEach(f=>console.log("  FAIL "+f))'

echo "--- real finger: tap the last view chip (upright it sat 350 px inside a 41 px strip) ---"
# `input tap` takes physical pixels and the rects are CSS px (dpr 2.625 here), so the coordinates are
# converted rather than read off the box.
CDP_PID="$PID" node devtools/cdp-eval.mjs '(()=>{const v=window.viewer;v.videoControls.showControls();const c=document.querySelector(".view-btn[data-view=right_pillar]");const r=c.getBoundingClientRect();return JSON.stringify({x:Math.round((r.left+r.width/2)*devicePixelRatio),y:Math.round((r.top+r.height/2)*devicePixelRatio),before:document.querySelector(".view-btn.active").dataset.view})})()' > devtools/r99-tap.json
read -r X Y BEFORE < <(node -e 'const j=require("./devtools/r99-tap.json");console.log(j.x,j.y,j.before)')
echo "  tap ${X},${Y} (CSS-dpr converted), active view was ${BEFORE}"
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell input tap "$X" "$Y"
sleep 2
AFTER=$(CDP_PID="$PID" node devtools/cdp-eval.mjs 'document.querySelector(".view-btn.active").dataset.view' | tr -d '\r')
echo "  active view now ${AFTER}"
[ "$AFTER" = "right_pillar" ] && echo "  OK: the chip took a real tap" || echo "  CHECK: tap did not switch the view (${BEFORE} -> ${AFTER})"

echo "--- rotate + landscape ---"
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 0
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 1
sleep 4
CDP_PID="$PID" node devtools/cdp-eval.mjs --file devtools/r99-open-panel.js
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r99-landscape-panel.png
CDP_PID="$PID" CDP_TIMEOUT_MS=180000 node devtools/cdp-eval.mjs --file devtools/r99-verify-landscape.js > devtools/r99-landscape.json
node -e 'const r=require("./devtools/r99-landscape.json");console.log("landscape pass",r.pass,"fail",r.fail.length,"plate h="+(r.height||"?"));r.fail.forEach(f=>console.log("  FAIL "+f))'
CDP_PID="$PID" node devtools/cdp-eval.mjs 'document.getElementById("tabMoreBtn").click(); "closed"'
sleep 1
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r99-landscape-controls.png

MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 0
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 1
echo "--- done, back to portrait ---"

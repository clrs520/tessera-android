#!/bin/bash
# R100 delivery driver: install the build under test (and refuse to measure anything else), run the
# trim-state portrait suite, rotate for real and run the column-alignment suite, screenshotting the
# surfaces the user reported on. Version is read from tauri.conf.json so the next round cannot
# accidentally install the previous one.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION="$(node -p 'require("./TDashcamStudio/src-tauri/tauri.conf.json").version')"
# Windows-style path: under MSYS_NO_PATHCONV a /c/... argument makes adb fail to stat the file and the
# script would otherwise keep measuring whatever old build is still installed.
APK="${APK:-C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/Tessera-${VERSION}.apk}"

echo "--- install $VERSION ---"
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 install -r -g "$APK" | tail -1
INSTALLED=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell dumpsys package com.tdashcam.studio | tr -d '\r' | grep -m1 -o 'versionName=[0-9.]*')
echo "  device reports $INSTALLED, expected versionName=$VERSION"
case "$INSTALLED" in *"=$VERSION") ;; *) echo "  ABORT"; exit 1 ;; esac

MSYS_NO_PATHCONV=1 "$ADB" shell am force-stop com.tdashcam.studio
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" shell am start -W -n com.tdashcam.studio/.MainActivity 2>&1 | grep -E "TotalTime|Status"
for i in $(seq 1 30); do
  PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
  [ -n "$PID" ] && MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
  N=$(CDP_PID="$PID" node devtools/cdp-eval.mjs '(()=>{const v=window.viewer;if(!v)return"WAIT";const e=(v.eventGroups||[]).length;return e>0?`READY ev=${e}`:`WAIT ev=${e}`})()' 2>/dev/null | tr -d '\r')
  [ "${N:0:5}" = "READY" ] && { echo "  $N"; break; }
  sleep 4
done

echo "--- portrait: trim-state suite ---"
CDP_PID="$PID" CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file devtools/r100-verify.js > devtools/r100-portrait.json
node -e 'const r=require("./devtools/r100-portrait.json");console.log("  portrait",r.orient,"pass",r.pass.length,"fail",r.fail.length);r.fail.forEach(f=>console.log("   FAIL "+f))'

echo "--- screenshots (the two views the user reported) ---"
CDP_PID="$PID" node devtools/cdp-eval.mjs '(async()=>{const v=window.viewer;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  if(!v.videoControls.clipModeActive){v.videoControls.toggleClipMode();await sleep(900);}
  document.querySelector(".view-btn[data-view=front]").click();await sleep(900);return "single trimming"})()'
sleep 1
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r100-single-trimming.png
CDP_PID="$PID" node devtools/cdp-eval.mjs 'document.querySelector(".view-btn[data-view=legacy]").click(),"legacy"'
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r100-legacy-trimming.png
CDP_PID="$PID" node devtools/cdp-eval.mjs '(()=>{const v=window.viewer;if(v.videoControls.clipModeActive)v.videoControls.toggleClipMode();document.querySelector(".view-btn[data-view=front]").click();return "left trim mode"})()'

echo "--- rotate: column alignment ---"
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 0
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 1
sleep 5
CDP_PID="$PID" CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file devtools/r100-verify-landscape.js > devtools/r100-landscape.json
node -e 'const r=require("./devtools/r100-landscape.json");console.log("  landscape",r.orient,"pass",r.pass.length,"fail",r.fail.length);r.fail.forEach(f=>console.log("   FAIL "+f))'
CDP_PID="$PID" node devtools/cdp-eval.mjs --file devtools/r99-open-panel.js
sleep 1
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 exec-out screencap -p > devtools/r100-landscape-panel.png
CDP_PID="$PID" node devtools/cdp-eval.mjs 'document.getElementById("tabMoreBtn").click(); "closed"'
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system user_rotation 0
sleep 2
MSYS_NO_PATHCONV=1 "$ADB" shell settings put system accelerometer_rotation 1
echo "--- done ---"

#!/usr/bin/env bash
# R207 目视截图：把六个面逐个摆出来并截图（判据只给数，样式类改动必须再看一眼画出来的东西 —— R42 的账）。
# 跑法：bash devtools/r207-shots.sh [方向：p|l]
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
TMP=/c/Users/Xingcong/AppData/Local/Temp/r207-shots
mkdir -p "$TMP"
run() { CDP_TIMEOUT_MS="${2:-120000}" ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs --file "$(cygpath -w "$1")" 2>&1 | tail -1; }
setface() { ADB_SERIAL="$DEV" CDP_TIMEOUT_MS=20000 node devtools/cdp-eval.mjs "localStorage.setItem('tdashcam.shotFace','$1')" >/dev/null 2>&1; }
shot() { node devtools/cdp-shot.mjs "$(cygpath -w "$TMP/$1.png")" 2>&1 | tail -1; }
adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }

adb_run "pm enable com.tdashcam.studio; am force-stop com.liangqing.photos; am force-stop com.tdashcam.studio; am start -n com.tdashcam.studio/.MainActivity" >/dev/null
sleep 20
for f in ctx-light ctx-dark pe-light pe-dark batch-light batch-dark kbdir pill; do
  setface "$f"
  echo "== $f : $(run devtools/r207-shot-prep.js)"
  shot "$f"
done
# 横屏筛选面要先把设备转过去（只认 innerWidth）
adb_run "settings put secure accelerometer_rotation 0; settings put system user_rotation 0" >/dev/null; sleep 3
adb_run "settings put system user_rotation 1" >/dev/null; sleep 8
setface lsheet-light
echo "== lsheet-light : $(run devtools/r207-shot-prep.js)"
shot lsheet-light
adb_run "settings put system user_rotation 0; settings put secure accelerometer_rotation 1" >/dev/null
echo "shots in $TMP"

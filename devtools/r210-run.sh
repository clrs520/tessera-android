#!/usr/bin/env bash
# R210 一整条验证链：旧包取红 → 构建 → 新包取绿 → 回归 → 装回正式包。
# 全程对着一块真的 1.9 TB 盘跑（不是夹具），所以每一步都要它挂着。
# 用法： DEV=192.168.6.189:45425 bash devtools/r210-run.sh
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
DEV="${DEV:-192.168.6.189:45425}"
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
PKG=com.tdashcam.studio
TMP=/c/Users/Xingcong/AppData/Local/Temp
LOG="$TMP/r210-run.log"
: > "$LOG"
say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

step_measure() {                       # $1 = 输出 json 名
    "$ADB" -s "$DEV" shell pm enable "$PKG" >>"$LOG" 2>&1
    "$ADB" -s "$DEV" shell am start -n "$PKG/.MainActivity" >>"$LOG" 2>&1
    sleep 12
    local pid; pid=$("$ADB" -s "$DEV" shell pidof "$PKG" | tr -d '\r')
    "$ADB" -s "$DEV" forward tcp:9450 "local:webview_devtools_remote_$pid" >>"$LOG" 2>&1
    CDP_TIMEOUT_MS=180000 ADB_SERIAL="$DEV" CDP_PORT=9450 \
        node devtools/cdp-eval.mjs --file devtools/r210-verify.js > "$TMP/$1" 2>>"$LOG"
    say "  读数 → $1: $(head -c 240 "$TMP/$1" | tr -d '\n')"
}

newest_apk() {
    ls -t src-tauri/gen/android/app/build/outputs/apk/*/re*se/*.apk 2>/dev/null | head -1
}

say "== 0) 盘必须在"
"$ADB" -s "$DEV" shell "ls /storage/B086-9116/TeslaCam >/dev/null 2>&1 && echo DRIVE_OK || echo DRIVE_MISSING" | tee -a "$LOG"

say "== 1) 改前：装 1.2.334 测试载具，取红基线"
"$ADB" -s "$DEV" install -r ../Tessera-1.2.334-testable.apk >>"$LOG" 2>&1 && say "  installed 1.2.334-testable"
step_measure r210-before.json

say "== 2) 构建可调试载具（同一份工作树 + TDASHCAM_TEST_DEBUGGABLE=1）"
TDASHCAM_TEST_DEBUGGABLE=1 bash devtools/build-apk.sh >>"$LOG" 2>&1
A=$(newest_apk); say "  产物 $A"
cp "$A" ../Tessera-1.2.335-testable.apk && say "  → ../Tessera-1.2.335-testable.apk（只当测试载具）"

say "== 3) 改后：装新载具，取绿"
"$ADB" -s "$DEV" install -r ../Tessera-1.2.335-testable.apk >>"$LOG" 2>&1 && say "  installed 1.2.335-testable"
step_measure r210-after.json

say "== 4) 回归：侧车本身的两套（不改语义，只改并发）"
DEV="$DEV" bash devtools/r205-sidecar.sh 2>&1 | tail -4 | tee -a "$LOG"
CDP_TIMEOUT_MS=60000 ADB_SERIAL="$DEV" CDP_PORT=9450 node devtools/cdp-eval.mjs \
    --file devtools/r168-verify.js > "$TMP/r210-r168.json" 2>>"$LOG"
say "  r168 流式预览：$(head -c 200 "$TMP/r210-r168.json" | tr -d '\n')"

say "== 5) 交付包：不带 debuggable 的正式构建"
bash devtools/build-apk.sh >>"$LOG" 2>&1
B=$(newest_apk); say "  产物 $B"
cp "$B" ../Tessera-1.2.335.apk && say "  → ../Tessera-1.2.335.apk"
ls -l ../Tessera-1.2.335*.apk | tee -a "$LOG"

say "== 6) 手机复原：装回不可调试包、清转发"
"$ADB" -s "$DEV" install -r ../Tessera-1.2.335.apk >>"$LOG" 2>&1 && say "  release installed"
"$ADB" -s "$DEV" shell "svc power stayon false" >>"$LOG" 2>&1
"$ADB" -s "$DEV" forward --remove-all >>"$LOG" 2>&1
say "== 完。读数文件：r210-before.json / r210-after.json / r210-r168.json"

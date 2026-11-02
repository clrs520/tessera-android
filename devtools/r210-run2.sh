#!/usr/bin/env bash
# R210 重跑（第一次那条链作废：改前基线 0 字节 + 盘在测量中途掉线）。
# 三处硬约束：
#   1) 测量前给盘做体检（mp4 数 ≥ 60 000），不合格直接退出 —— 不把盘的失败记成产品的失败；
#   2) 每一步查退出码，判据 json 必须非空且带 verdict，否则停；
#   3) 「绿不绿」由 node 解析 json 决定，不靠人眼看；只有绿才建正式包。
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
DEV="${DEV:-192.168.6.189:45425}"
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
PKG=com.tdashcam.studio
TMP=/c/Users/Xingcong/AppData/Local/Temp
LOG="$TMP/r210-run2.log"
: > "$LOG"
say() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }
die() { say "停：$*"; exit 1; }

drive_count() {
    "$ADB" -s "$DEV" shell "find /storage/B086-9116/TeslaCam -name '*.mp4' 2>/dev/null | wc -l" | tr -d '\r'
}
build_testable() {                    # $1 = 交付文件名
    if [ -f "$1" ]; then say "  已存在，跳过构建：$1"; return 0; fi
    TDASHCAM_TEST_DEBUGGABLE=1 bash devtools/build-apk.sh >>"$LOG" 2>&1 \
        || die "构建失败（$1）"
    local a; a=$(ls -t src-tauri/gen/android/app/build/outputs/apk/*/re*se/*.apk 2>/dev/null | head -1)
    [ -n "$a" ] || die "找不到构建产物"
    grep -q "Finished 1 APK" "$LOG" || say "  注意：日志里没有 'Finished 1 APK'，用 mtime 认账"
    cp "$a" "$1" || die "复制失败 $1"
    say "  产物 $1"
}
# 无线 adb 会被别人一句 `adb disconnect` 踢掉（2026-11-02 那次回滚脚本的收尾就这么打断了我这条链），
# 所以每次要用设备之前自己确保连着，而不是假设开局连上了就一直连着。
ensure_conn() {
    "$ADB" devices | grep -q "^[[:space:]]*$DEV[[:space:]]*device$" && return 0
    adb connect "$DEV" >>"$LOG" 2>&1
    sleep 2
    "$ADB" devices | grep -q "^[[:space:]]*$DEV[[:space:]]*device$" || die "连不上 $DEV（无线调试是否还开着？）"
}
measure() {                           # $1 = 输出 json
    ensure_conn
    "$ADB" -s "$DEV" install -r "$2" >>"$LOG" 2>&1 || die "装包失败 $2"
    "$ADB" -s "$DEV" shell pm enable "$PKG" >>"$LOG" 2>&1
    "$ADB" -s "$DEV" shell am start -n "$PKG/.MainActivity" >>"$LOG" 2>&1
    sleep 12
    local pid; pid=$("$ADB" -s "$DEV" shell pidof "$PKG" | tr -d '\r')
    [ -n "$pid" ] || die "APP 没起来"
    "$ADB" -s "$DEV" forward tcp:9450 "local:webview_devtools_remote_$pid" >>"$LOG" 2>&1
    CDP_TIMEOUT_MS=240000 ADB_SERIAL="$DEV" CDP_PORT=9450 \
        node devtools/cdp-eval.mjs --file devtools/r210-verify.js > "$TMP/$1" 2>>"$LOG" \
        || die "判据跑失败（$1）"
    [ -s "$TMP/$1" ] || die "判据输出是空的（$1）—— 上一轮就是这么把红基线丢掉的"
    grep -q verdict "$TMP/$1" || die "判据输出里没有 verdict（$1）"
    say "  $1 → $(node -e 'const o=require(process.argv[1]);console.log(o.verdict+" sidecar="+(o.measured&&o.measured.sidecarMs)+"ms wall="+(o.measured&&o.measured.wallMs)+"ms files="+(o.measured&&o.measured.files)+" hash="+(o.measured&&o.measured.cityHash)+" red="+o.red.length)' "$TMP/$1")"
}

say "== 0) 盘的体检（上一轮就是死在这儿）"
adb connect "$DEV" >/dev/null 2>&1
N=$(drive_count); case "$N" in ''|*[!0-9]*) N=0;; esac
say "  mp4 数 = $N（上一次坏掉时只剩 8 085）"
[ "$N" -ge 60000 ] || die "盘不合格：count=$N，重插或换盘"

say "== 1) 改前：当前源码（并发已退回）建测试载具，取红基线"
build_testable ../Tessera-1.2.336-testable.apk
measure r210c-before.json ../Tessera-1.2.336-testable.apk

say "== 2) 重新贴上并发补丁，版本抬到 1.2.337，建测试载具取绿"
git apply ../r210-sidecar-concurrency.patch || die "补丁贴不上"
grep -q SIDECAR_READERS src-tauri/src/lib.rs || die "补丁没有生效"
sed -i 's/"version": "1.2.336"/"version": "1.2.337"/' src-tauri/tauri.conf.json
build_testable ../Tessera-1.2.337-testable.apk
measure r210c-after.json ../Tessera-1.2.337-testable.apk

say "== 3) 判绿：完整性与两条阈值都不许红，且两份 hash 必须相等"
GREEN=$(node -e '
const before=require(process.argv[1]), after=require(process.argv[2]);
const serious=(o)=>o.red.filter(r=>/完整性|R210/.test(r));
const pre=(o)=>o.red.filter(r=>/前置/.test(r));
const ok = pre(after).length===0 && serious(after).length===0
    && pre(before).length===0 && serious(before).length>0
    && before.measured.cityHash===after.measured.cityHash
    && after.measured.sidecarMs < before.measured.sidecarMs;
console.log(JSON.stringify({ok, beforeRed:before.red, afterRed:after.red,
  before:{sidecar:before.measured.sidecarMs, wall:before.measured.wallMs, files:before.measured.files, hash:before.measured.cityHash},
  after:{sidecar:after.measured.sidecarMs, wall:after.measured.wallMs, files:after.measured.files, hash:after.measured.cityHash}}));
' "$TMP/r210c-before.json" "$TMP/r210c-after.json" | tee -a "$LOG")
say "== 4) N=${N} 判绿结果：$GREEN"
case "$GREEN" in *'"ok":true'*)
    say "  绿：建正式包 1.2.337"
    bash devtools/build-apk.sh >>"$LOG" 2>&1 || die "正式包构建失败"
    C=$(ls -t src-tauri/gen/android/app/build/outputs/apk/*/re*se/*.apk | head -1)
    cp "$C" ../Tessera-1.2.337.apk || die "复制失败"
    "$ADB" -s "$DEV" install -r ../Tessera-1.2.337.apk >>"$LOG" 2>&1 || say "  装正式包失败（不影响结论）"
    ;;
    *) say "  不绿：源码退回并发补丁，1.2.336 仍是已知安全的那一份"
       git checkout -- src-tauri/src/lib.rs
       sed -i 's/"version": "1.2.337"/"version": "1.2.336"/' src-tauri/tauri.conf.json ;;
esac
N2=$(drive_count); say "== 5) 收尾再数一次盘（前后都该是同一块）：$N2"
"$ADB" -s "$DEV" shell "dumpsys package $PKG | grep -m1 versionName" 2>&1 | head -1 | tee -a "$LOG"
"$ADB" -s "$DEV" forward --remove-all >>"$LOG" 2>&1
say "== 完"

#!/usr/bin/env bash
# 手机当测试台之前的 readiness 闸门：MIUI 上 `input` 与 `settings put` 都被拒，adb 没法把屏幕留住。
# 唯一还能用的组合是：`svc power stayon true` 那一下**只负责把屏幕弄亮一拍**，趁这一拍问页面一句
# —— 页面答话就说明判据能落，不答就直接退出，别把超时记成产品缺陷。
# 试过并且**不成立**的一条，留在这里免得下次再试：让页面自己 `setKeepScreenOn(true)` 顶住超时。
# 那面旗（`MainActivity.kt:1466` → `FLAG_KEEP_SCREEN_ON`）只在小窗可见期间成立，
# 而唤醒后压在最上面的是 `NotificationShade` / keyguard，`visibilityState` 回 `hidden` ⇒ 屏幕照睡。
# ⇒ 长判据在这台手机上要么每次跑完这一段、要么请他把「充电时常亮 / 屏幕超时」调成不睡。
# 跑法：bash devtools/phone-awaken.sh [序列号]
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${1:-${DEV:-e152f205}}"
PORT="${CDP_PORT:-9450}"
run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@" 2>&1 | tr -d '\r'; }
ask() { ADB_SERIAL="$DEV" CDP_PORT="$PORT" CDP_TIMEOUT_MS="$2" node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }

ANSWER=""
for i in 1 2 3 4 5 6; do
    run 'svc power stayon true' >/dev/null
    run 'am start -n com.tdashcam.studio/.MainActivity' >/dev/null
    sleep 2
    R="$(ask 'JSON.stringify({vis:document.visibilityState,up:Math.round(performance.now()/1000)})' 12000)"
    echo "try$i: $R"
    case "$R" in
        *\{*) ANSWER="$R"; break ;;
    esac
done
if [ -z "$ANSWER" ]; then
    echo "页面没答话（多半是屏幕又睡了）—— 这套判据不能在这台手机上跑"
    exit 1
fi
echo ">>> 钉住常亮：$(ask '(function(){try{window.TDashcamNative.setKeepScreenOn(true);return "fired";}catch(e){return "err "+e.message;}})()' 20000)"
for i in 1 2 3 4; do
    sleep 10
    echo "t$((i*10))s wake: $(run 'dumpsys power | grep -m1 mWakefulness=' | tr -d '\r')"
done
echo "focus: $(run 'dumpsys window | grep -m1 mCurrentFocus' | tr -d '\r')"

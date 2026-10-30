#!/usr/bin/env bash
# R147 判据：点进度条上的事件红点，时间轴必须跳到那一秒。
# 修复前：进度条在 pointerdown 里 setPointerCapture，红点的 click 被改投走，红点等于摆设。
# 用真实 adb 手指；前置（红点存在、命中红点）不成立就报 fatal，不白捡通过。
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
ADB=$(command -v adb)
DPR=2.7
cdp() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-120000} node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }
cdpf() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-240000} node devtools/cdp-eval.mjs --file "$1" 2>&1 | tail -1; }

S=$(cdpf devtools/r147-marker.js); echo "SETUP $S"
echo "$S" | grep -q '"ok":true' || { echo "FATAL setup"; exit 1; }
echo "$S" | grep -q '"hitIsMarker":true' || { echo "FATAL marker not hit-testable"; exit 1; }
EXP=$(echo "$S" | sed -n 's/.*"expected":\([0-9.]*\).*/\1/p')
X=$(echo "$S" | sed -n 's/.*"tapX":\([0-9]*\).*/\1/p')
Y=$(echo "$S" | sed -n 's/.*"tapY":\([0-9]*\).*/\1/p')
DX=$(awk "BEGIN{printf \"%d\", $X*$DPR+0.5}"); DY=$(awk "BEGIN{printf \"%d\", $Y*$DPR+0.5}")

# 坐标再确认一次（红点不随控件动画移动，但仍以落指前那一刻为准）
"$ADB" -s emulator-5554 shell input tap "$DX" "$DY"
sleep 2
AFTER=$(cdp "(function(){var t=window.viewer.continuousPlayer.getCurrentTime();return JSON.stringify({t:Math.round(t*10)/10});})()")
echo "TAP css($X,$Y) -> dev($DX,$DY) expected=$EXP after=$AFTER"
NOW=$(echo "$AFTER" | sed -n 's/.*"t":\([0-9.]*\).*/\1/p')
OK=$(awk -v a="$NOW" -v b="$EXP" 'BEGIN{d=a-b; if(d<0)d=-d; print (d<=2.0)?"yes":"no"}')
echo "RESULT marker-seek=$OK (|Δ|<=2s)"
[ "$OK" = yes ] && exit 0
exit 1

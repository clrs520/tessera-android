#!/usr/bin/env bash
# R146 判据：横屏大小窗，**一次**真实点击左/右下窗就要把它提成大窗。
# 量坐标与落指必须在同一次往返里做完：抽屉/遮罩会在一秒内挪走小窗，分两条命令就会点空
# （踩过的坑：SETUP 报 tapX 462，落指后连遮罩都没叫醒 —— 那一下根本没砸中小窗）。
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
ADB=$(command -v adb)
DEV=emulator-5554
export DPR=2.7
cdp() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-120000} node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }
cdpf() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-240000} node devtools/cdp-eval.mjs --file "$1" 2>&1 | tail -1; }

# —— 方向：ORIENT=L 横屏（默认，用户报的那一档）/ ORIENT=P 竖屏（反例守卫，别把好的改坏）——
WANT=$([ "${ORIENT:-L}" = P ] && echo 400 || echo 889)
"$ADB" -s $DEV shell settings put system accelerometer_rotation 0 >/dev/null
"$ADB" -s $DEV shell settings put system user_rotation 0 >/dev/null; sleep 2
for t in 1 2 3 4 5 6; do
    "$ADB" -s $DEV shell settings put system user_rotation $([ "$WANT" = 889 ] && echo 1 || echo 0) >/dev/null
    for i in $(seq 1 12); do W=$(cdp "innerWidth"); [ "$W" = "$WANT" ] && break 2; sleep 1; done
done
[ "$W" = "$WANT" ] || { echo "FATAL not orient ${ORIENT:-L} innerWidth=$W"; exit 1; }

SETUP=$(cdpf devtools/r146-setup.js); echo "SETUP $SETUP"
echo "$SETUP" | grep -q '"ok":true' || { echo "FATAL setup"; exit 1; }

# —— 一次点击：量 + 落指同一往返 ——
# $1 = 选择器，$2 = 期望换成的相机。先收遮罩，保证测的是「遮罩收起时那一下」。
tapcheck() {
    # `hideControls()` 在暂停态是拒绝的，而换相机正好会让这一拍暂停 —— 收不成就必须报
    # HARNESS_FAIL，不能拿「小窗还压在遮罩下」的现场去判产品（right 那条第一次就是这么假的）。
    cdp "(function(){var vc=window.viewer.videoControls;if(!vc.isPlaying){try{vc.togglePlayPause()}catch(e){}}vc.hideControls();return 'h';})()" >/dev/null
    for i in $(seq 1 12); do
        H=$(cdp "(function(){return (window.viewer.videoControls.isPlaying&&!document.getElementById('videoControlsOverlay').classList.contains('show'))?'ready':'no';})()")
        [ "$H" = "ready" ] && break
        sleep 1
    done
    [ "$H" = "ready" ] || { echo "HARNESS_FAIL $1 -> controls never hid"; return 2; }
    OUT=$(bash devtools/tap-el.sh "$1" 2>&1 | tail -1); echo "TAP $OUT"
    case "$OUT" in TAPPED*) ;; *) echo "HARNESS_FAIL $1 -> $OUT"; return 2;; esac
    sleep 2
    RES=$(cdp "(function(){var m=window.viewer.multiCameraPlayer;var o=document.getElementById('videoControlsOverlay');return JSON.stringify({active:m.activeCamera,shown:o.classList.contains('show')});})()")
    echo "    after $RES"
    echo "$RES" | grep -q "\"active\":\"$2\"" && return 0 || return 1
}

tapcheck '#left-container'  left  ; R1=$?
tapcheck '#right-container' right ; R2=$?
tapcheck '#back-container'  back  ; R3=$?

cdp "(function(){window.viewer.multiCameraPlayer.setCamera('front');return 'front';})()" >/dev/null
nm() { [ "$1" = 0 ] && echo yes || echo no; }
echo "RESULT left=$(nm $R1) right=$(nm $R2) back=$(nm $R3)"
[ "$R1" = 0 ] && [ "$R2" = 0 ] && [ "$R3" = 0 ] && exit 0
exit 1

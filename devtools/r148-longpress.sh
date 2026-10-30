#!/usr/bin/env bash
# R148 判据 B：长按 3× 之后松手，不能顺带把宫格放大。
# 真实 adb 长按（同一坐标按住 700ms）。修复前 suppressPlayerTapUntil 在按住那一刻只盖 900ms 内的
# 1.35s 窗口，且已在高倍速时根本不设 —— 松手的 click 会落到格子上，宫格被放大成单路。
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
ADB=$(command -v adb)
DPR=2.7
cdp() { CDP_TIMEOUT_MS=${CDP_TIMEOUT:-120000} node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }

# 竖屏 + 宫格 + 播放中（长按只在播放器区域生效）
SET=$("$ADB" -s emulator-5554 shell settings put system user_rotation 0)
SET=$("$ADB" -s emulator-5554 shell settings put system accelerometer_rotation 0)
for i in $(seq 1 20); do W=$(cdp "innerWidth"); [ "$W" = "400" ] && break; sleep 1; done
echo "w=$W"

PRE=$(cdp "(async function(){var v=window.viewer;if(!v.eventGroups.length){await v.loadTauriDirectory('/storage/emulated/0/TeslaCam');for(var i=0;i<80&&!v.eventGroups.length;i++)await new Promise(r=>setTimeout(r,500));}var ev=v.eventGroups.find(e=>(e.segments||[]).length)||v.eventGroups[0];v.multiCameraPlayer.setLayout('grid4');if(!v.currentEvent||v.currentEvent.eventId!==ev.eventId){await v.playEvent(ev.eventId);for(var j=0;j<40&&document.querySelector('.player-area').classList.contains('empty');j++)await new Promise(r=>setTimeout(r,250));}var vc=v.videoControls;if(!vc.isPlaying){try{vc.togglePlayPause()}catch(e){}}await new Promise(r=>setTimeout(r,600));var c=document.querySelector('.video-container.is-grid');var b=c.getBoundingClientRect();return JSON.stringify({layout:v.multiCameraPlayer.layoutMode,active:v.multiCameraPlayer.activeCamera,x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),playing:vc.isPlaying});})()")
echo "PRE $PRE"
echo "$PRE" | grep -qE '"layout":"grid(4)?"' || { echo "FATAL not a grid layout"; exit 1; }
X=$(echo "$PRE" | sed -n 's/.*"x":\([0-9]*\).*/\1/p'); Y=$(echo "$PRE" | sed -n 's/.*"y":\([0-9]*\).*/\1/p')
DX=$(awk "BEGIN{printf \"%d\", $X*$DPR+0.5}"); DY=$(awk "BEGIN{printf \"%d\", $Y*$DPR+0.5}")

"$ADB" -s emulator-5554 shell input swipe "$DX" "$DY" "$DX" "$DY" 700
sleep 2
POST=$(cdp "(function(){var v=window.viewer;return JSON.stringify({layout:v.multiCameraPlayer.layoutMode,active:v.multiCameraPlayer.activeCamera,zoomed:document.body.classList.contains('camera-zoomed'),rate:v.multiCameraPlayer.playbackRate});})()")
echo "POST $POST"
echo "$POST" | grep -qE '"layout":"grid(4)?"' && { echo "RESULT long-press-kept-grid=yes"; exit 0; }
echo "RESULT long-press-kept-grid=no (被当成点击放大了)"
exit 1

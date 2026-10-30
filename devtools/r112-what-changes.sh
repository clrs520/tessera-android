#!/usr/bin/env bash
# R112 取证：播放中**真点击**「设置」，把开之前 / 开之后每一面的外观三件套抓下来（含真视频的 screencap，
# CDP 截图没有视频平面 —— R102 记过）。顺序固定，中间不 sleep 太久，免得迟滞自己动过又被算进「开合造成」。
set -u
cd "$(dirname "$0")/.." || exit 1
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
export MSYS_NO_PATHCONV=1
P="$("$ADB" shell pidof com.tdashcam.studio | tr -d '\r ')"
[ -z "$P" ] && { echo "APP 没在跑"; exit 1; }
"$ADB" forward tcp:9333 "localabstract:webview_devtools_remote_$P" >/dev/null || exit 1
echo "pid=$P"

ev() { CDP_PID="$P" CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs "$1" 2>/dev/null | tr -d '\r'; }

echo "--- 1. 切单路 + 确保在播（用户的场景是画面铺满、玻璃压在画面上） ---"
ev '(async()=>{const v=window.viewer;if(!v)return "no viewer";document.querySelector(".view-btn[data-view=\"front\"]")?.click();await new Promise(r=>setTimeout(r,1500));if(!v.isPlaying){try{v.togglePlayPause()}catch(e){}await new Promise(r=>setTimeout(r,3000))}if(!v.isPlaying){const ev=(v.eventGroups||[]).find(x=>!/RecentClips/i.test(String(x.eventId||"")));try{await v.playEvent(ev.eventId)}catch(e){}await new Promise(r=>setTimeout(r,3000));try{v.multiCameraPlayer.playAll()}catch(e){}await new Promise(r=>setTimeout(r,2000))}return JSON.stringify({playing:!!v.isPlaying,live:[...document.querySelectorAll("video")].filter(x=>x.videoWidth>0).length,view:document.querySelector(".player-area").className.slice(0,40),lensOn:document.querySelectorAll(".lens-on").length})})()'
XY=$(ev '(()=>{const b=document.getElementById("tabMoreBtn");const r=b.getBoundingClientRect();return Math.round((r.left+r.width/2)*devicePixelRatio)+" "+Math.round((r.top+r.height/2)*devicePixelRatio)})()' | tail -1 | tr -d '"')
read -r TX TY <<< "$XY"
echo "TAP=$TX $TY"

echo "--- 2. 开之前 ---"
"$ADB" exec-out screencap -p > devtools/shot-112-before.png
ev '(()=>{window.__r112Tag="before";return 1})()' >/dev/null
node devtools/cdp-eval.mjs --file devtools/r112-surface-state.js > devtools/out-112-before.json 2>/dev/null
tail -c 1400 devtools/out-112-before.json

echo "--- 3. 真点击「设置」 ---"
"$ADB" shell input tap "$TX" "$TY"

echo "--- 4. 点击后 400ms（面板动画 0.3s 刚走完） ---"
sleep 0.4
"$ADB" exec-out screencap -p > devtools/shot-112-mid.png
ev '(()=>{window.__r112Tag="mid+0.4s";return 1})()' >/dev/null
node devtools/cdp-eval.mjs --file devtools/r112-surface-state.js > devtools/out-112-mid.json 2>/dev/null
tail -c 1400 devtools/out-112-mid.json

echo "--- 5. 再等 3 秒（让迟滞有机会动，若有会写在 alpha 上） ---"
sleep 3
"$ADB" exec-out screencap -p > devtools/shot-112-after.png
ev '(()=>{window.__r112Tag="after+3.4s";return 1})()' >/dev/null
node devtools/cdp-eval.mjs --file devtools/r112-surface-state.js > devtools/out-112-after.json 2>/dev/null
tail -c 1400 devtools/out-112-after.json
echo "--- 完成：devtools/shot-112-{before,mid,after}.png ---"

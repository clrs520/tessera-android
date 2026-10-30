#!/bin/bash
# Sweep the app through several real-device display profiles and report layout sanity for each.
# usage: bash devtools/fit-sweep.sh
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
export CDP_TIMEOUT_MS=25000
cd "$(dirname "$0")/.."
for profile in "1080x2280 480" "720x1600 320" "1440x3200 560" "1280x800 320" "800x1280 320"; do
    set -- $profile
    adb shell wm size "$1"
    adb shell wm density "$2"
    sleep 3
    echo "=== ${1} @ ${2}dpi ==="
    node devtools/cdp-eval.mjs 'document.getElementById("metaDetailBtn").click(); "ok"' >/dev/null 2>&1
    sleep 1
    node devtools/cdp-eval.mjs --file devtools/probe-r31-fitcheck.js \
      | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(JSON.stringify({vp:j.vp,hOverflow:j.hOverflow,vOverflow:j.vOverflow,tabsOnScreen:j.tabs.onScreen,tabs:j.tabs.rects[0],plate:j.plate,player:j.player}))}catch(e){console.log('RAW '+s.slice(0,200))}})"
done
adb shell wm size reset
adb shell wm density reset
sleep 3
echo "=== reset ==="

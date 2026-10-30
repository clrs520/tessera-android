#!/usr/bin/env bash
# R88 appearance pass: one screenshot per surface the round changed, each preceded by the setup probe
# that puts the page in that state. A computed-style check has passed on a broken stylesheet before
# (R42), so the picture is the evidence.
set -uo pipefail
cd "$(dirname "$0")/.."
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
PID=$($ADB -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
[ -z "$PID" ] && { echo "app is not running"; exit 1; }
$ADB -s emulator-5554 forward --remove-all >/dev/null 2>&1
$ADB -s emulator-5554 forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null

cap () {
    local file="$1"
    # The AVD's framebuffer can answer screencap with a frame from tens of seconds ago. Nudge the
    # panel to scroll so the compositor has a reason to present, then capture.
    CDP_PID=$PID CDP_TIMEOUT_MS=20000 node devtools/cdp-eval.mjs \
        "(() => {const b=viewer.peDom.body; b.scrollTop=b.scrollTop>0?0:1; return 1;})()" >/dev/null 2>&1
    sleep 1.2
    MSYS_NO_PATHCONV=1 $ADB -s emulator-5554 exec-out screencap -p > "devtools/$file" 2>/dev/null
}

shoot () {
    local mode="$1" file="$2"
    echo "=== $mode -> $file"
    CDP_PID=$PID CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs "window.__r88mode='$mode'; 'armed'" >/dev/null 2>&1
    CDP_PID=$PID CDP_TIMEOUT_MS=180000 node devtools/cdp-eval.mjs --file devtools/r88-show.js \
        > "devtools/r88-show-$mode.json" 2>&1
    node -e "
const fs=require('fs');const raw=fs.readFileSync('devtools/r88-show-$mode.json','utf8').trim();
try{const j=JSON.parse(raw);console.log('  pane='+j.pane+' cap='+(j.cap||'')+' zoomShown='+j.zoomShown
    +' zoomTime='+(j.zoomTime||'')+' wait='+JSON.stringify(j.previewBox)+' layers='+j.layers);}
catch(e){console.log('  NON-JSON '+raw.slice(0,200));}
"
    cap "$file"
    # If the picture is byte-identical to the one before it, it is the stale frame, not this state.
    local prev="$PREV_SHOT" tries=0
    while [ -n "$prev" ] && [ "$(md5sum < "devtools/$file")" = "$(md5sum < "devtools/$prev")" ] && [ $tries -lt 3 ]; do
        tries=$((tries+1)); echo "  identical to $prev, re-capturing ($tries)"
        sleep 2; cap "$file"
    done
    [ -s "devtools/$file" ] && echo "  shot $file ($(stat -c%s "devtools/$file") B)" || echo "  SHOT FAILED"
    PREV_SHOT="$file"
}

PREV_SHOT=""
shoot view  r88-adb-view.png
shoot over  r88-adb-over.png
shoot range r88-adb-range.png
shoot zoom  r88-adb-zoom.png

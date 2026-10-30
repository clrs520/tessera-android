#!/usr/bin/env bash
# R89: the same page driven with **real taps** (`adb shell input tap`), because `element.click()`
# dispatches straight at a node and never hit-tests — a page wholly covered by an invisible overlay
# passes every synthetic check and is dead under a thumb. That is how 1.2.135 shipped.
#
# Prints one line per tap: what was tapped, the state after, and the verdict. Reads no URL/token.
set -uo pipefail
cd "$(dirname "$0")/.."
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DEV=emulator-5554
PID=$($ADB -s $DEV shell pidof com.tdashcam.studio | tr -d '\r')
[ -z "$PID" ] && { echo "app is not running"; exit 1; }
$ADB -s $DEV forward --remove-all >/dev/null 2>&1
$ADB -s $DEV forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null

ev () { CDP_PID=$PID CDP_TIMEOUT_MS=${CDP_TIMEOUT_MS:-60000} node devtools/cdp-eval.mjs "$1" 2>&1 | tail -1; }

# ---- put the page in a known state and collect every tap point in device pixels
POINTS=$(CDP_TIMEOUT_MS=200000 node devtools/cdp-eval.mjs --file devtools/r88-taps-arm.js 2>&1 | tail -1)
echo "arm: ${POINTS:0:200}"
case "$POINTS" in '{'*) ;; *) echo "arming failed"; exit 1;; esac

state () {
    ev "(() => { const m=document.getElementById('phoneExportModal'),
        z=document.getElementById('peZoomModal'), o=viewer.readExportOverlay();
        return JSON.stringify({shown:m.classList.contains('show'), pane:viewer.pePane,
            zoom:z.classList.contains('show'), layers:viewer.phoneLayerCount(),
            cams:[...viewer.peSelection.cameras].join('+'), size:viewer.peSelection.size,
            label:o.label, badge:o.badge, prev:viewer.pePreviewOn,
            top:(document.querySelector('.modal-overlay.show')||{}).id||'-'}); })()"
}

tap () {
    local name="$1"
    local xy
    xy=$(node -e "const j=JSON.parse(process.argv[1]);process.stdout.write(j.points['$name']||'')" "$POINTS")
    if [ -z "$xy" ]; then echo "  ---- $name: NO POINT"; return; fi
    # R90: the point was measured at a scroll the arm had to reach for. Switching panes resets that
    # scroll, so the harness puts it back — a finger that taps where a control *was* before the
    # content moved is not testing the control, it is testing the fold.
    local sc
    sc=$(node -e "const j=JSON.parse(process.argv[1]);const s=j.scrolls&&j.scrolls['$name'];process.stdout.write(s==null?'':String(s))" "$POINTS")
    if [ -n "$sc" ]; then
        ev "(() => { const b=viewer.peDom.body; if (b) b.scrollTop=$sc; return '1'; })()" >/dev/null
        sleep 0.4
    fi
    local before after
    before=$(state)
    MSYS_NO_PATHCONV=1 $ADB -s $DEV shell input tap ${xy/,/ } >/dev/null 2>&1
    sleep 0.9
    after=$(state)
    if [ "$before" = "$after" ]; then
        echo "  FAIL $name @ $xy scroll=${sc:-0}: 点了没有任何变化"
    else
        echo "  ok   $name @ $xy -> $(node -e "
const b=JSON.parse(process.argv[1]),a=JSON.parse(process.argv[2]);
const d=Object.keys(a).filter(k=>String(b[k])!==String(a[k])).map(k=>k+':'+b[k]+'→'+a[k]);
process.stdout.write((a.shown?'页在':'页关')+' '+(a.top||'')+' · '+d.join(' '));" "$before" "$after" 2>/dev/null)"
    fi
}

echo "=== real taps"
for name in tabOver chipLabel chipBadge tabRange tabView chipBack chipBack2 size480 \
            previewBtn previewBtn2 zoomCanvas zoomClose navBack; do
    tap "$name"
done
echo "=== final: $(state)"

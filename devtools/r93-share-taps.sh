#!/usr/bin/env bash
# R93 real-tap harness: 最近导出 + 分享, driven with actual fingers.
# `element.click()` does no hit testing (the R89 lesson), so every action here is `adb input tap`
# at device-pixel coordinates, and "the chooser came up" is read from the resumed activity, not
# from a promise that resolved.
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
cd "$(dirname "$0")/.." || exit 1
DEV=emulator-5554

PID=$(adb -s $DEV shell pidof com.tdashcam.studio | tr -d '\r')
if [ -z "$PID" ]; then echo "NO-PID"; exit 1; fi
adb -s $DEV forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null
echo "PID=$PID"

ev() { CDP_PID=$PID CDP_TIMEOUT_MS="${2:-40000}" node devtools/cdp-eval.mjs "$1"; }
evf() { CDP_PID=$PID CDP_TIMEOUT_MS="${2:-40000}" node devtools/cdp-eval.mjs --file "$1"; }

focus() { adb -s $DEV shell dumpsys window 2>/dev/null | grep -m1 -E "mCurrentFocus|mFocusedApp" | tr -d '\r'; }

echo "== part 1: write one clip for real, then measure the rows =="
ARM=$(evf devtools/r93-share-arm.js 600000)
echo "$ARM"

echo "== part 2: tap every 分享 button =="
# Record which row the page believes was pressed. An `adb input tap` is hit-tested by the WebView,
# so this is the only proof that the finger actually landed on the button and not on a layer over it.
ev 'window.__r93shareCalls=[]; (function(){var o=viewer.shareExport.bind(viewer); viewer.shareExport=function(i){window.__r93shareCalls.push(i); return o(i);};})()'
echo "$ARM" | node -e '
let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
  let j; try { j = JSON.parse(s.replace(/^"|"$/g, "").replace(/\\"/g, "\"")); } catch (e) { return; }
  (j.points || []).forEach(p => console.log(p.x + " " + p.y + " " + p.i + " " + p.hit));
});' > /tmp/r93pts
while read -r X Y I HIT; do
    [ -z "$X" ] && continue
    echo "-- tap row $I (elementFromPoint=$HIT) at $X,$Y"
    adb -s $DEV shell input tap "$X" "$Y"
    sleep 4
    echo "   focus: $(focus)"
    adb -s $DEV exec-out screencap -p > "devtools/r93-share-tap-$I.png"
    adb -s $DEV shell input keyevent KEYCODE_BACK
    sleep 2
done < /tmp/r93pts
echo "   rows the page saw pressed: $(ev 'JSON.stringify(window.__r93shareCalls||[])')"

echo "== part 3: the deleted-file branch =="
ev 'window.__r93seed = 1' >/dev/null
MISS=$(evf devtools/r93-share-missing.js)
echo "   armed: $MISS"
XY=$(echo "$MISS" | node -e '
let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
  let j; try { j = JSON.parse(s.replace(/^"|"$/g, "").replace(/\\"/g, "\"")); } catch (e) { return; }
  if (j.x) console.log(j.x + " " + j.y + " " + j.hit);
});')
echo "   tap point: $XY"
set -- $XY
if [ -n "$1" ]; then
    adb -s $DEV shell input tap "$1" "$2"
    sleep 3
    echo "   focus after the dead-row tap: $(focus)"
    adb -s $DEV exec-out screencap -p > devtools/r93-share-missing.png
fi
ev 'window.__r93seed = 0' >/dev/null
echo "   readback: $(evf devtools/r93-share-missing.js)"

echo "== part 4: the page is still healthy =="
ev 'JSON.stringify({rows:(viewer.peExports||[]).length, errors:(viewer.recentErrors||[]).length, errs:(window.__r93err||[]).length})'
echo "done"

#!/bin/bash
# R64-2 deliberate deviation check: taps honour the picture band, but the two DRAG gestures keep their
# screen-edge claim (a 44px brightness strip in landscape would be unusable). Verify both still work,
# that the camera fling actually changes feed (R64-2c), and that the ±10s chip lands on the picture.
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

# x's outside the picture band on both sides: left third of the screen = brightness, right letterbox = camera.
px() { awk "BEGIN{printf \"%d\", ($1)*$DPR+0.5}"; }

echo -n "before      : "; node devtools/cdp-eval.mjs --file devtools/p34.js
adb shell "input swipe $(px 150) $(px 250) $(px 150) $(px 130) 420" >/dev/null
sleep 1.5; echo -n "bright up   : "; node devtools/cdp-eval.mjs --file devtools/p34.js
adb shell "input swipe $(px 150) $(px 130) $(px 150) $(px 260) 420" >/dev/null
sleep 1.5; echo -n "bright down : "; node devtools/cdp-eval.mjs --file devtools/p34.js
adb shell "input swipe $(px 700) $(px 130) $(px 700) $(px 250) 300" >/dev/null
sleep 2.5; echo -n "camera next : "; node devtools/cdp-eval.mjs --file devtools/p34.js
adb shell "input swipe $(px 700) $(px 250) $(px 700) $(px 130) 300" >/dev/null
sleep 2.5; echo -n "camera prev : "; node devtools/cdp-eval.mjs --file devtools/p34.js
node devtools/cdp-eval.mjs "viewer.setBrightness(1,false); 'brightness reset'" >/dev/null
$ADB shell screencap -p /sdcard/r70drag.png
$ADB pull /sdcard/r70drag.png devtools/r70-drag.png >/dev/null 2>&1
echo "shot: devtools/r70-drag.png"

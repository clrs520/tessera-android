#!/bin/bash
# R64-2 deliberate deviation check: taps honour the picture band, but the two DRAG gestures keep their
# screen-edge claim (a 44px brightness strip in landscape would be unusable). Verify both still work and
# that the chip/rail reads move.
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

px() { awk "BEGIN{printf \"%d\", ($1)*$DPR+0.5}"; }
READ="JSON.stringify({bright:+(viewer.brightnessLevel||0).toFixed(3), cam:viewer.multiCameraPlayer.activeCamera, band:viewer.pictureGestureBand().left|0, w:viewer.pictureGestureBand().width|0, dim:(document.getElementById('phoneBrightnessDim')||{}).className, rail:(document.getElementById('phoneBrightnessRail')||{}).className})"

echo -n "before          : "; node devtools/cdp-eval.mjs "$READ"
adb shell "input swipe $(px 150) $(px 250) $(px 150) $(px 130) 420" >/dev/null
sleep 1.5; echo -n "brightness up   : "; node devtools/cdp-eval.mjs "$READ"
adb shell "input swipe $(px 150) $(px 130) $(px 150) $(px 260) 420" >/dev/null
sleep 1.5; echo -n "brightness down : "; node devtools/cdp-eval.mjs "$READ"
adb shell "input swipe $(px 700) $(px 130) $(px 700) $(px 250) 420" >/dev/null
sleep 2.0; echo -n "camera next     : "; node devtools/cdp-eval.mjs "$READ"
adb shell "input swipe $(px 700) $(px 250) $(px 700) $(px 130) 420" >/dev/null
sleep 2.0; echo -n "camera prev     : "; node devtools/cdp-eval.mjs "$READ"

#!/usr/bin/env bash
# R95: the fix takes the reveal away from a *programmatic* resume. It must leave the reveal that a
# real finger causes. `element.click()` cannot answer this — it does no hit-testing and the listener
# lives on #playerArea, so a synthetic call would pass even with the wrong geometry. Tap for real.
set -u
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
cd "$(dirname "$0")/.."
PID=$("$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
"$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
probe() { CDP_PID=$PID CDP_TIMEOUT_MS=40000 node devtools/cdp-eval.mjs "$1"; }

echo "== 1. let the bar auto-hide, then confirm it is down"
probe '(async()=>{var o=window.viewer.videoControls.overlay;for(var i=0;i<40&&o.classList.contains("show");i++)await new Promise(r=>setTimeout(r,250));return JSON.stringify({show:o.classList.contains("show"),playing:window.viewer.multiCameraPlayer.isPlaying});})()'
read -r X Y < <(probe '(function(){var b=document.getElementById("playerArea").getBoundingClientRect();var d=window.devicePixelRatio;return JSON.stringify([Math.round((b.left+b.width/2)*d),Math.round((b.top+b.height/2)*d)]);})()' | tr -d '[]"' | tr ',' ' ')
echo "   tap target (physical px): $X $Y"

echo "== 2. one real tap on the picture must bring it up"
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell input tap "$X" "$Y"
sleep 1
probe 'JSON.stringify({show:window.viewer.videoControls.overlay.classList.contains("show")})'

echo "== 3. and it must go away again by itself"
sleep 5
probe 'JSON.stringify({show:window.viewer.videoControls.overlay.classList.contains("show"),playing:window.viewer.multiCameraPlayer.isPlaying})'

echo "== 4. the button must flip the state and the tap must keep the bar up"
# The first version of this step assumed the clip was playing and read 「paused never auto-hides」 off a
# press that had actually *resumed* it — so the bar fading at 3 s was correct behaviour read as a
# regression. Assert on the flip, not on a hoped-for starting state.
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell input tap "$X" "$Y"
sleep 0.4
read -r BX BY < <(probe '(function(){var b=document.getElementById("playPauseBtn").getBoundingClientRect();var d=window.devicePixelRatio;return JSON.stringify([Math.round((b.left+b.width/2)*d),Math.round((b.top+b.height/2)*d)]);})()' | tr -d '[]"' | tr ',' ' ')
BEFORE=$(probe 'JSON.stringify(window.viewer.multiCameraPlayer.isPlaying)')
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell input tap "$BX" "$BY"
sleep 1
probe "JSON.stringify({wasPlaying:$BEFORE, now:window.viewer.multiCameraPlayer.isPlaying, revealedByThePress:window.viewer.videoControls.overlay.classList.contains(\"show\")})"

echo "== 5. five seconds later the bar follows the state it ended in: paused keeps it, playing fades it"
sleep 5
probe "JSON.stringify({now:window.viewer.multiCameraPlayer.isPlaying, shown:window.viewer.videoControls.overlay.classList.contains(\"show\"), verdict:(window.viewer.multiCameraPlayer.isPlaying?!window.viewer.videoControls.overlay.classList.contains(\"show\"):window.viewer.videoControls.overlay.classList.contains(\"show\"))?'ok':'wrong-for-the-state'})"

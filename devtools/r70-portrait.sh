#!/bin/bash
# R64-2 portrait pass. The landscape acceptance used hardcoded x's; in portrait the picture is a
# 0.45-ratio feed inside a tall area, so the same rule has to be re-measured from the live band:
#   black left / black right  -> must do nothing
#   left third / right third  -> -10s / +10s, chips on the picture
#   centre                    -> next camera (needs the R64-2c fix to have anything to step to)
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
ROT=${ROT:-0}

fwd() {
    PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
    $ADB forward --remove-all >/dev/null 2>&1
    $ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; return 1; }
    [ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; return 1; }
}

E="0"
[ "$ROT" = "0" ] || E="1"
$ADB shell "settings put system accelerometer_rotation 0; settings put system user_rotation $E"
$ADB shell "am force-stop com.tdashcam.studio"
sleep 2
$ADB shell "am start -n com.tdashcam.studio/.MainActivity" >/dev/null
sleep 9
fwd || exit 1
node devtools/cdp-eval.mjs "typeof viewer!=='undefined' && !!viewer.multiCameraPlayer ? 'alive' : (()=>{throw new Error('no viewer')})()"
node devtools/cdp-eval.mjs "localStorage.setItem('tdashcam.autoNext','0'); viewer.autoNextEnabled=false; 'single-armed'" >/dev/null
# Cold start: the folder scan has to finish before `eventGroups` contains the id, and playEvent
# starts with `if (!event) return;` — call it too early and it returns *successfully* having opened
# nothing. The band then falls back to the whole play area (`nat 0x0`), every tap reads inert, and
# the pass measures a player that never loaded a clip. So: kick, wait, and re-kick while the group
# exists but no event is open. Awaiting the call in-page is not an option (playAll + tap-entry-point
# together outlast the ~10s CDP answer budget), hence the flag.
echo "opening event..."
for i in $(seq 1 30); do
    R=$(node devtools/cdp-eval.mjs "(!viewer.currentEvent && viewer.eventGroups.some(e=>e.eventId==='TeslaCam/RecentClips')) ? (viewer.playEvent('TeslaCam/RecentClips').catch(()=>{}), 'kicked') : 'wait';")
    S=$(node devtools/cdp-eval.mjs "String(!!viewer.currentEvent)")
    [ "$S" = "true" ] && break
    sleep 3
done
[ "$S" = "true" ] || { echo "NO EVENT AFTER 90s (last kick: $R)"; exit 1; }
echo "event open after $((i * 3))s"
# After the open, not before: playEvent re-applies the stored layout (`tdashcam.layout`), so a
# setLayout done beforehand is undone — and the double-tap zones only arm in `single`, so a pass done
# in `legacy` reports `steps:0` for every tap while looking exactly like a dead gesture.
node devtools/cdp-eval.mjs "viewer.multiCameraPlayer.setLayout('single'); 'single'" >/dev/null
sleep 3
sleep 6
node devtools/cdp-eval.mjs --file devtools/p29.js
sleep 2
node devtools/cdp-eval.mjs "viewer.continuousPlayer.seekToTime(60); viewer.multiCameraPlayer.playAll(); 'seeded'" >/dev/null
sleep 9
# A paused transport turns the same taps into frame steps (chip 「−1 帧」), so a zone pass done while
# the transport is stopped measures the wrong branch. Re-arm once if the crossing is buffering.
P=$(node devtools/cdp-eval.mjs "String(!!viewer.multiCameraPlayer.isPlaying)")
if [ "$P" != "true" ]; then
    node devtools/cdp-eval.mjs "viewer.multiCameraPlayer.playAll(); 'replayed'" >/dev/null
    sleep 5
    P=$(node devtools/cdp-eval.mjs "String(!!viewer.multiCameraPlayer.isPlaying)")
fi
echo -n "geometry : "; node devtools/cdp-eval.mjs --file devtools/p35.js
echo "         : playing=$P (must be true before the taps below mean ±10s)"

G=$(node devtools/cdp-eval.mjs --file devtools/p35.js)
read -r BL TL CC TR BR TY <<< "$(node -e "
const g=JSON.parse(process.argv[1]);
const r=v=>Math.round(v);
console.log([g.blackLeft,g.thirds[0],g.thirds[1],g.thirds[2],g.blackRight,g.tapY].join(' '));
" "$G")"
echo "taps(css): blackL=$BL left=$TL centre=$CC right=$TR blackR=$BR y=$TY"

# ⚠ revision facts before any wrapper replaces the methods they read.
node devtools/cdp-eval.mjs --file devtools/p27.js
node devtools/cdp-eval.mjs --file devtools/p12.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p15.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p21.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p23.js >/dev/null
node devtools/cdp-eval.mjs --file devtools/p25.js >/dev/null
node devtools/cdp-eval.mjs "window.__steps=[]; window.__chips=[]; window.__taps=[]; window.__seeklog=[]; window.__camSteps=[]; window.__lifts=[]; document.addEventListener('pointerup', e => window.__lifts.push(Math.round(e.timeStamp)), true); 'cleared'" >/dev/null

px() { awk "BEGIN{printf \"%d\", ($1)*$DPR+0.5}"; }
echo "--- timed real double taps: black / left / right / black (+centre last) ---"
# Not `adb shell input tap`: two spawns are 360-730ms apart and the pair never reaches the 340ms
# window, so a portrait pass done that way measures nothing. See dbltap.mjs.
for X in $BL $TL $TR $BR; do
    node devtools/dbltap.mjs $X $TY 1
    node devtools/cdp-eval.mjs "JSON.stringify({x:$X,steps:window.__steps.length,chips:window.__chips.map(c=>c.text+':'+c.side),ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1),playing:viewer.multiCameraPlayer.isPlaying})"
done
node devtools/dbltap.mjs $CC $TY 1 &
sleep 0.7; $ADB shell screencap -p /sdcard/r70port.png; wait
node devtools/cdp-eval.mjs --file devtools/p24.js
node devtools/cdp-eval.mjs --file devtools/p34.js
$ADB shell screencap -p /sdcard/r70port.png
$ADB pull /sdcard/r70port.png devtools/r70-portrait-chip.png >/dev/null 2>&1
echo "shot: devtools/r70-portrait-chip.png"

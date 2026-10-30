#!/bin/bash
# R65 acceptance: after a real scrub (or a ±10s burst), how many times does each feed get aimed, by
# whom, and does any of them end up behind the shared clock? Run it on the old build for the baseline
# and on the new one for the fix — the probe only wraps the DOM setter, so both are comparable.
#
# usage: devtools/r65-storm.sh <label> [scrub|burst|both]
set -u
cd "$(dirname "$0")/.."
ADB='/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe'
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
LABEL=${1:-run}; MODE=${2:-both}
DPR=${DPR:-2.625}
px() { awk "BEGIN{printf \"%d\", ($1)*$DPR+0.5}"; }
ev() { node devtools/cdp-eval.mjs "$@" 2>&1 | tail -1; }

PID=$($ADB shell pidof -s com.tdashcam.studio | tr -d '\r')
$ADB forward --remove-all >/dev/null 2>&1
$ADB forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null || { echo "forward failed"; exit 1; }
[ "$($ADB shell dumpsys window | grep -c 'mCurrentFocus=Window.*tdashcam')" = "1" ] || { echo "NOT FOCUSED"; exit 1; }

G=$(ev --file devtools/p46.js)
echo "geom: $G"
eval "$(echo "$G" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
const g=JSON.parse(s), b=g.band||[0,0,0];
const f=(k,v)=>console.log(`${k}=${Math.round(v)}`);
f("BAND_L",b[0]); f("BAND_W",b[1]); f("MIDY",g.bandMidY||0);
f("BARMID",g.barMidY||0); f("S20",(g.scrubXs||[0,0])[0]); f("S80",(g.scrubXs||[0,0])[1]);
f("MIDL",b[0]+b[1]/6); f("MIDC",b[0]+b[1]/2); f("MIDR",b[0]+b[1]*5/6);
})')"

ev --file devtools/p16.js >/dev/null
ev --file devtools/p15.js >/dev/null
ev --file devtools/p13.js >/dev/null
echo "arm: $(ev --file devtools/p44.js)"
ev "viewer.autoNextEnabled=false; String(1)" >/dev/null
echo "state: $(ev "(()=>{const p=viewer.multiCameraPlayer;return JSON.stringify({play:p.isPlaying,lay:p.layoutMode,ct:+viewer.continuousPlayer.getCurrentTime().toFixed(1)})})()")"

if [ "$MODE" != burst ]; then
    # Put playback mid-event: seekToTime() past the current segment's end clamps silently and returns
    # "success", so a fixed 200 on a 18 s fixture measures a player that has already finished.
    ev "viewer.multiCameraPlayer.setLayout('grid4');'layout'" >/dev/null
    echo "seed: $(ev "(()=>{const c=viewer.continuousPlayer;c.seekToTime(Math.round(c.totalDuration*0.35));viewer.multiCameraPlayer.playAll();return 'ok'})()")"
    for i in 1 2 3 4 5; do
        sleep 2
        S=$(ev "(()=>{const m=viewer.multiCameraPlayer,c=viewer.continuousPlayer;return JSON.stringify({cur:+c.getCurrentTime().toFixed(1),dur:+c.totalDuration.toFixed(0),play:m.isPlaying,lay:m.layoutMode,rs:m.players.front.readyState,susp:m.suspendedFeeds.size})})()")
        echo "  ready: $S"
        case "$S" in *'"play":true'*) break;; esac
    done
    ev "window.__hw.writes={};window.__hw.by={};window.__hw.hist={};window.__hw.total=0;window.__hw.armed=performance.now();'reset'" >/dev/null
    echo "--- 3 real scrubs on #progressContainer y=$(px $BARMID) ---"
    # Assert each drag lands as a move of the shared clock: without this a whole run can measure a
    # player that was never scrubbed, and 「拖完进度条以后」 becomes an untested premise. Retry once,
    # and say out loud if a drag still did not take so the report can be read against it.
    for pair in "$S20 $S80" "$S80 $S20" "$S20 $S80"; do
        set -- $pair
        for attempt in 1 2; do
            BEFORE=$(ev "(()=>{const c=viewer.continuousPlayer;return Math.round(c.getCurrentTime())})()")
            $ADB shell "input swipe $(px $1) $(px $BARMID) $(px $2) $(px $BARMID) 700" >/dev/null
            sleep 2.5
            AFTER=$(ev "(()=>{const c=viewer.continuousPlayer;return JSON.stringify({t:Math.round(c.getCurrentTime()),w:window.__hw.total})})()")
            echo "  drag $1->$2 #$attempt : before=$BEFORE after=$AFTER"
            case "$AFTER" in *\"t\":$BEFORE*) continue;; esac
            break
        done
    done
    sleep "${TAIL:-6}"
    # A tail measured on a finished player proves nothing about a corrector that is no longer running.
    echo "tail-check: $(ev "(()=>{const m=viewer.multiCameraPlayer,c=viewer.continuousPlayer;return JSON.stringify({play:m.isPlaying,cur:+c.getCurrentTime().toFixed(1),dur:+c.totalDuration.toFixed(0),segClock:+m.clockTime().toFixed(2)})})()")"
    node devtools/cdp-eval.mjs --file devtools/p45.js > "devtools/r65-storm-$LABEL-scrub.json"
    echo "scrub report: devtools/r65-storm-$LABEL-scrub.json"
    cat "devtools/r65-storm-$LABEL-scrub.json"
fi

if [ "$MODE" != scrub ]; then
    # The ±10s pair is only offered on a single full-screen feed (R63-1), so this half runs in `single`
    # and measures the other half of the report: what one jump does to the six feeds behind it.
    ev "viewer.multiCameraPlayer.setLayout('single');'layout'" >/dev/null
    echo "seed: $(ev "(()=>{const c=viewer.continuousPlayer;c.seekToTime(Math.round(c.totalDuration*0.35));viewer.multiCameraPlayer.playAll();return 'ok'})()")"
    # Poll until actually playing: a paused feed turns every ±10s double tap into a single-frame step,
    # so the burst half would count 6 writes for the wrong reason.
    for i in 1 2 3 4 5; do
        sleep 2
        S=$(ev "(()=>{const m=viewer.multiCameraPlayer,c=viewer.continuousPlayer;return JSON.stringify({cur:+c.getCurrentTime().toFixed(1),play:m.isPlaying,lay:m.layoutMode,rs:m.players.front.readyState})})()")
        echo "  ready: $S"
        case "$S" in *'"play":true'*) break;; esac
    done
    ev "window.__hw.writes={};window.__hw.by={};window.__hw.hist={};window.__hw.total=0;window.__hw.armed=performance.now();'reset'" >/dev/null
    # The gesture band is per-layout: single-view is a narrow centred picture, not the full grid width.
    G2=$(ev --file devtools/p46.js)
    echo "geom(single): $G2"
    eval "$(echo "$G2" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
const g=JSON.parse(s), b=g.band||[0,0,0];
const f=(k,v)=>console.log(`${k}=${Math.round(v)}`);
f("MIDY",g.bandMidY||0); f("BAND_L",b[0]); f("BAND_W",b[1]);
f("MIDL",b[0]+b[1]/6); f("MIDC",b[0]+b[1]/2); f("MIDR",b[0]+b[1]*5/6);
})')"
    echo "--- 6 alternating +/-10 double taps, band [$BAND_L +$BAND_W] y=$MIDY, x=$MIDL/$MIDR ---"
    for i in 1 2 3; do
        node devtools/dbltap.mjs "$MIDL" "$MIDY" 1 0 60 >/dev/null 2>&1
        sleep 0.9
        node devtools/dbltap.mjs "$MIDR" "$MIDY" 1 0 60 >/dev/null 2>&1
        sleep 0.9
    done
    sleep 10
    node devtools/cdp-eval.mjs --file devtools/p45.js > "devtools/r65-storm-$LABEL-burst.json"
    echo "burst report: devtools/r65-storm-$LABEL-burst.json"
    cat "devtools/r65-storm-$LABEL-burst.json"
fi

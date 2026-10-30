#!/bin/bash
# Landscape picture gestures, sampled above the filmstrip band (y=110): in landscape clip mode the
# strip sits over the middle of the feed and `blocksFeedGesture` claims it, so a probe at y=160
# tests the strip rather than the picture.
cd /c/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998
P() { node devtools/cdp-eval.mjs '(()=>{const v=window.viewer,c=v.videoControls;const h=document.getElementById("phoneFeedHint");return JSON.stringify({lm:v.multiCameraPlayer.layoutMode,act:v.multiCameraPlayer.activeCamera,play:Math.round(c.continuousPlayer.getCurrentTime()*100)/100,playing:v.multiCameraPlayer.isPlaying,chip:document.getElementById("phoneFeedValue").textContent,live:h.classList.contains("show")});})()' 2>&1|tail -1; }
echo -n "start:    "; P
bash devtools/dbltap.sh 200 110; sleep 0.3
echo -n "dbl-L:    "; P
bash devtools/dbltap.sh 750 110; sleep 0.3
echo -n "dbl-R:    "; P
bash devtools/dbltap.sh 458 110; sleep 0.4
echo -n "dbl-MID:  "; P
bash devtools/tap.sh 82 270; sleep 0.5
echo -n "playing:  "; P
bash devtools/dbltap.sh 750 110; sleep 0.3
echo -n "play-R:   "; P
bash devtools/dbltap.sh 200 110; sleep 0.3
echo -n "play-L:   "; P
bash devtools/tap.sh 82 270; sleep 0.3
echo -n "paused:   "; P

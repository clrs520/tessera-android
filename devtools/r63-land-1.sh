#!/bin/bash
# Landscape R63-1/2 sweep in one shot: the clip is only 62s and auto-advance is live, so every
# adb round trip between reads risks the event changing underneath the test.
cd /c/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998
P() { node devtools/cdp-eval.mjs '(()=>{const c=window.viewer.videoControls;const v=window.viewer;return JSON.stringify({lm:v.multiCameraPlayer.layoutMode,act:v.multiCameraPlayer.activeCamera,play:Math.round(c.continuousPlayer.getCurrentTime()*10)/10,chip:document.getElementById("phoneFeedValue").textContent,show:document.getElementById("phoneFeedHint").className});})()' 2>&1|tail -1; }
bash devtools/tap.sh 358 269; sleep 0.7
echo -n "single: "; P
PB=$(node devtools/cdp-eval.mjs '(()=>{const r=document.getElementById("playPauseBtn").getBoundingClientRect();return Math.round(r.x+r.width/2)+" "+Math.round(r.y+r.height/2);})()' 2>&1|tail -1|tr -d '"')
echo "playbtn: $PB"
bash devtools/tap.sh $PB; sleep 0.5
echo -n "playing: "; P
bash devtools/dbltap.sh 750 160; sleep 0.35
echo -n "dbl-right: "; P
bash devtools/dbltap.sh 150 160; sleep 0.35
echo -n "dbl-left: "; P
bash devtools/tap.sh $PB; sleep 0.4
echo -n "paused: "; P

#!/bin/bash
# Landscape R63-1, instrumented: switch to a single feed, start playback, then take two taps on the
# right third while a capture-phase pointerup logger reports every gate the zone checks.
cd /c/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998
bash devtools/tap.sh 750 349; sleep 0.6
bash devtools/tap.sh 358 269; sleep 0.7
node devtools/cdp-eval.mjs '(()=>{const v=window.viewer;return JSON.stringify({lm:v.multiCameraPlayer.layoutMode,dur:v.videoControls.totalDuration});})()' 2>&1|tail -1
bash devtools/tap.sh 82 270; sleep 0.4
node devtools/r63-up-diag.mjs 2 750 160 2>&1 | tr -d ' \n' | sed 's/},{/}\n{/g'

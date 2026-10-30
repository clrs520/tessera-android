#!/usr/bin/env bash
# Measure an element's centre through CDP and tap it immediately, in one shell round trip.
# The ⋮ panel has an auto-collapse timer and the bottom bar drifts as player chrome hides/shows, so
# measuring in one command and tapping in the next regularly aims at a layout that no longer exists.
# usage: devtools/tap-el.sh <css-selector> [extra adb-free delay ms before tapping]
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
XY=$(CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs "(function(){var e=document.querySelector('$1');if(!e)return 'missing';var r=e.getBoundingClientRect();if(!r.width||!r.height)return 'zero';var c=getComputedStyle(e);if(c.display==='none'||c.visibility==='hidden'||c.pointerEvents==='none')return 'unhit:'+c.display+'/'+c.visibility+'/'+c.pointerEvents;return Math.round(r.left+r.width/2)+','+Math.round(r.top+r.height/2);})()" 2>/dev/null | tail -1 | tr -d '"')
if [[ "$XY" != *,* ]]; then
    echo "TAP_SKIPPED $1 -> $XY"
    exit 2
fi
X=${XY%%,*}
Y=${XY##*,}
adb shell input tap "$(awk "BEGIN{printf \"%d\", $X*$DPR+0.5}")" "$(awk "BEGIN{printf \"%d\", $Y*$DPR+0.5}")"
echo "TAPPED $1 at css $X,$Y"

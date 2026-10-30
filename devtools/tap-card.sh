#!/usr/bin/env bash
# Tap the event card whose data-event-id contains a substring, measuring it first.
# Cards are re-rendered by paging and by the drawer animation, so a cached y lands on the wrong row.
# usage: devtools/tap-card.sh <eventId-substring>
cd "$(dirname "$0")/.." || exit 1
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
DPR=${DPR:-2.625}
XY=$(CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs "(function(){
  var want='$1';
  var cards=[...document.querySelectorAll('.video-card')];
  var hit=cards.filter(function(c){return (c.dataset.eventId||c.getAttribute('data-event-id')||'').indexOf(want)>=0;})[0];
  if(!hit)return 'missing:'+cards.length;
  var r=hit.getBoundingClientRect();
  if(r.bottom<60||r.top>innerHeight-70)return 'offscreen:'+Math.round(r.top)+','+Math.round(r.bottom);
  return Math.round(r.left+r.width/2)+','+Math.round(r.top+Math.min(r.height/2,26));
})()" 2>/dev/null | tail -1 | tr -d '"')
if [[ "$XY" != *,* ]]; then
    echo "CARD_SKIPPED $1 -> $XY"
    exit 2
fi
X=${XY%%,*}
Y=${XY##*,}
adb shell input tap "$(awk "BEGIN{printf \"%d\", $X*$DPR+0.5}")" "$(awk "BEGIN{printf \"%d\", $Y*$DPR+0.5}")"
echo "TAPPED_CARD $1 at css $X,$Y"

#!/usr/bin/env bash
# Print "x,y" for the centre of an element, so a tap can be issued against a live layout.
# usage: measure.sh <css-selector> [id|class]
SEL="$1"
OUT=$(CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs "(function(){var e=document.querySelector('$SEL');if(!e)return 'missing';var r=e.getBoundingClientRect();return Math.round(r.left+r.width/2)+','+Math.round(r.top+r.height/2);})()" 2>/dev/null | tail -1)
echo "$OUT" | tr -d '"'

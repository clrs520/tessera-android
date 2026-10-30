#!/bin/bash
# R25-1: walk the app through real tablet display profiles and report layout sanity for each.
# `wm size`/`wm density` recreate the Activity, so every profile starts back at the landing
# state; the drawer, the ⋮ panel, the About sheet and the folder browser are then opened with
# real taps (adb input, DPR derived from the density we just set) before each measurement.
# usage: bash devtools/tablet-sweep.sh
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1
export CDP_TIMEOUT_MS=30000
cd "$(dirname "$0")/.."
ADB=adb

center() { # <js-expression-yielding-an-element>  -> "x,y"
    node devtools/cdp-eval.mjs "(function(){var e=$1;if(!e)return 'none';var r=e.getBoundingClientRect();return Math.round(r.left+r.width/2)+','+Math.round(r.top+r.height/2);})()" \
        | tr -d '"'
}

condense() {
    node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);console.log(JSON.stringify({vp:j.screen.w+'x'+j.screen.h+'@'+j.screen.dpr,coarse:j.screen.coarse,tablet:j.screen.tabletLayout,collapsed:j.screen.headerCollapsed,over:[j.doc.hOverflow,j.doc.vOverflow],bar:j.geometry.bar,barTabH:j.geometry.barTabH,tabsOnScreen:j.geometry.tabsOnScreen,sidebar:j.geometry.sidebar,sidebarMaxW:j.geometry.sidebarMaxW,gutter:j.geometry.gutter,fieldH:j.geometry.fieldH,rowsShown:j.menu.shownRows,rowsTotal:j.menu.rows.length,rowH:j.menu.rows[0]?j.menu.rows[0].h:0,rowText:j.menu.rows.every(r=>r.textVisible!==false),menuScroll:j.menu.scroll,about:j.about,chips:j.chips?j.chips.list.map(c=>c.text+'|h'+c.h):null,small:j.smallTouch.map(x=>x.t+':'+x.w+'x'+x.h),overflowing:j.overflowing,errs:j.errors,banner:j.banner}))}catch(e){console.log('RAW '+s.slice(0,200))}})"
}

# Each entry is PHYSICAL px + dpi, not the CSS dp you are trying to reach: the emulator's
# viewport is px/(dpi/160). "1280x720" at 240dpi is 1280x720 CSS only by coincidence of that
# arithmetic; write the target dp and back-solve the pair (see doc/ANDROID_CN.md, R25).
#   1280x800 · 800x1280 · 960x600 · 1024x768 · 1093x820 · 1280x720 · 1067x1707 dp
for profile in "2560x1600 320" "1600x2560 320" "1920x1200 320" "1024x768 160" "2048x1536 300" "1920x1080 240" "1600x2560 240"; do
    set -- $profile
    $ADB shell wm size "$1"
    $ADB shell wm density "$2"
    export DPR=$(awk "BEGIN{print $2/160}")
    sleep 9
    # `wm size` recreates the Activity but the WebView keeps its DOM, so a profile inherits
    # whatever the previous one left open (About sheet, folder browser, ⋮ panel, drawer). An
    # open overlay swallows the first real tap and the whole scripted sequence drifts one step
    # — on a portrait tablet that reads as "⋮ never opened", because the tap lands on the
    # drawer scrim and closes it instead. Close the leftovers through the app's own API
    # (writing the class by hand is not enough: the app re-renders it from its state).
    node devtools/cdp-eval.mjs "(function(){document.querySelectorAll('.modal-overlay.show .close-modal-btn').forEach(function(b){b.click()});document.querySelectorAll('.header-right.active,.header-actions-group.active').forEach(function(e){e.classList.remove('active')});document.body.classList.remove('more-panel-open','context-open');if(window.viewer&&viewer.toggleSidebar)viewer.toggleSidebar(false);return 'clean';})()" >/dev/null
    sleep 1
    echo "=== ${1} @ ${2}dpi, css $(awk -v p="$1" -v d="$2" 'BEGIN{split(p,a,"x"); printf "%dx%d", a[1]/(d/160), a[2]/(d/160)}') (dpr $DPR) ==="
    node devtools/cdp-eval.mjs --file devtools/probe-r33-r25.js | condense
    c=$(center "document.getElementById('tabMoreBtn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 1
    echo "  -- more panel --"
    node devtools/cdp-eval.mjs --file devtools/probe-r33-r25.js | condense
    # With the tablet menu rows no longer squeezed to fit, the last row (关于) can sit below
    # the scroll cap on a short window; scroll it into view, then tap where it actually is.
    node devtools/cdp-eval.mjs "document.getElementById('aboutBtn').scrollIntoView({block:'center'})" >/dev/null
    sleep 1
    c=$(center "document.getElementById('aboutBtn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 1
    echo "  -- about sheet --"
    node devtools/cdp-eval.mjs --file devtools/probe-r33-r25.js | condense
    mkdir -p devtools/shots
    node devtools/cdp-shot.mjs "devtools/shots/r25-$(awk -v p="$1" -v d="$2" 'BEGIN{split(p,a,"x"); printf "%dx%d", a[1]/(d/160), a[2]/(d/160)}')-about.png" >/dev/null 2>&1
    c=$(center "document.querySelector('#aboutModal .close-modal-btn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 1
    c=$(center "document.getElementById('tabListBtn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 1
    c=$(center "document.getElementById('selectFolderBtn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 3
    echo "  -- folder browser --"
    node devtools/cdp-eval.mjs --file devtools/probe-r33-r25.js | condense
    c=$(center "document.querySelector('.dir-modal-content .close-modal-btn')")
    bash devtools/tap.sh ${c%,*} ${c#*,}; sleep 1
done
$ADB shell wm size reset
$ADB shell wm density reset
sleep 6
echo "=== reset to phone profile ==="
node devtools/cdp-eval.mjs --file devtools/probe-r33-r25.js | condense

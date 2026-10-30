#!/usr/bin/env bash
# R111 收尾复跑：迟滞改了两回（死区不清零 / 退档要走完），每套都要在同一个实例上重测一遍。
# 顺序是有讲究的：先跑只读采样的 audit（它会临时换掉 measureBackdropLuma，跑完还原），
# 再跑 stability（它自己也要换量具），最后才跑那两个会点 UI 的套件 —— 否则前者的残留会脏后者。
set -u
cd "$(dirname "$0")/.." || exit 1
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
export MSYS_NO_PATHCONV=1
P="$("$ADB" shell pidof com.tdashcam.studio | tr -d '\r ')"
if [ -z "$P" ]; then echo "APP 没在跑，先 am start"; exit 1; fi
"$ADB" forward tcp:9333 "localabstract:webview_devtools_remote_$P" >/dev/null || exit 1
echo "pid=$P version=$("$ADB" shell dumpsys package com.tdashcam.studio | tr -d '\r' | grep -m1 -o 'versionName=[0-9.]*')"

run() {   # run <探针文件名> <输出标签>
    local f="$1" tag="$2"
    echo "=== $f ==="
    CDP_PID="$P" CDP_TIMEOUT_MS=900000 node devtools/cdp-eval.mjs --file "devtools/$f.js" \
        > "devtools/out-$tag.json" 2> "devtools/out-$tag.err"
    echo "exit=$?"
    node devtools/read-pass.mjs "devtools/out-$tag.json" 2>&1 | head -30
    head -c 200 "devtools/out-$tag.err"
}

run r110-release-audit r110-audit
run r109-alpha-stability r109-stab
run r102-verify r102-portrait
run r108-verify r108-verify
run r106-solid-tier-check r106-solid
# R113：量不到底色那一拍「什么都不动」的直接取证（它换掉 measureBackdropLuma / measureCssBackdropLuma
# 两个桩再换回来，跑完自己复原 alpha，所以放在会点 UI 的那几套之后）。
run r113-nosrc-hold r113-hold
# who-repins 会给 `markGlassMaterial()` 包一层计数器，包装是留在页面上的（R102/R108 那条「探针残留」）
# —— 所以放在最后，让它去污染别人的可能性降到最低。
run r109-who-repins r109-repins

echo "=== 转横屏 ==="
"$ADB" shell settings put system accelerometer_rotation 0 >/dev/null
"$ADB" shell settings put system user_rotation 1 >/dev/null
sleep 25
run r102-verify-landscape r102-land
"$ADB" shell settings put system user_rotation 0 >/dev/null
sleep 20
echo "=== 已转回竖屏 ==="

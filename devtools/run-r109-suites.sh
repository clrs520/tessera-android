#!/usr/bin/env bash
# R109 收尾：把剩下的套件按顺序跑完，每跑完一份立刻用 read-pass.mjs 打结果。
# 为什么要脚本：上一版把 `node -e "..."` 塞进 for 循环，引号一多就静默什么都不打，
# 三条套件只留下两个 0 字节文件（看着像探针全挂了，其实是打印环节坏了）。
set -u
cd "$(dirname "$0")/.." || exit 1
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
export MSYS_NO_PATHCONV=1
P="$("$ADB" shell pidof com.tdashcam.studio | tr -d '\r ')"
if [ -z "$P" ]; then echo "APP 没在跑，先 am start"; exit 1; fi
"$ADB" forward tcp:9333 "localabstract:webview_devtools_remote_$P" >/dev/null || exit 1
echo "pid=$P"

run() {   # run <探针文件> <输出名>
    local f="$1" tag="$2"
    echo "=== $f ==="
    CDP_PID="$P" CDP_TIMEOUT_MS=900000 node devtools/cdp-eval.mjs --file "devtools/$f.js" \
        > "devtools/out-$tag.json" 2> "devtools/out-$tag.err"
    echo "exit=$?"
    node devtools/read-pass.mjs "devtools/out-$tag.json" 2>&1 | head -25
    head -c 200 "devtools/out-$tag.err"
}

run r102-verify r102-portrait
run r109-alpha-stability r109-stab
run r108-verify r108-verify
run r106-solid-tier-check r106-solid

echo "=== 转横屏 ==="
"$ADB" shell settings put system accelerometer_rotation 0 >/dev/null
"$ADB" shell settings put system user_rotation 1 >/dev/null
sleep 25
run r102-verify-landscape r102-land
"$ADB" shell settings put system user_rotation 0 >/dev/null
sleep 20
echo "=== 已转回竖屏 ==="

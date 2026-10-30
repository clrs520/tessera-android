#!/usr/bin/env bash
# R102-2: 把 AVD 配成小米 14 的 CSS 视口，而不是它的物理面板。
#
# 小米 14 = 1200x2670 @ 460ppi，HyperOS 默认密度 440dpi → CSS 视口 436x971，dpr 2.75。
# 本机 AVD 是 1080x2400 @ 420dpi → CSS 411x914。直接 `wm size 1200x2670` 会被物理面板钳掉，
# 而且量的也不是那台机器的 CSS 尺寸。所以反过来算：要 CSS 宽 436，density = 1080/436*160 = 396。
# 第二档 432 是 HyperOS「显示大小」调到最小（等效 480dpi → CSS 400 宽）的最坏情况。
#
# 用法：r102-xiaomi.sh apply <396|432|reset>   —— 只改度量，不装包
set -uo pipefail
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
D="${2:-396}"
if [ "${1:-}" = "apply" ]; then
  if [ "$D" = "reset" ]; then
    MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell wm density reset
  else
    MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell wm density "$D"
  fi
  MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell am force-stop com.tdashcam.studio
  sleep 2
  MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell monkey -p com.tdashcam.studio -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
  sleep 26
  PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
  echo "pid=$PID density=$D"
  echo "$PID" > devtools/r102.pid
  MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
  CDP_PID=$PID CDP_TIMEOUT_MS=30000 node devtools/cdp-eval.mjs 'JSON.stringify({css:`${Math.round(innerWidth)}x${Math.round(innerHeight)}`,dpr:devicePixelRatio,phone:!!window.viewer&&window.viewer.constructor.name})' 2>&1 | tail -2
else
  echo "usage: r102-xiaomi.sh apply <396|432|reset>   (396 → CSS 436 宽，432 → CSS 400 宽)"
fi

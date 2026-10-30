#!/usr/bin/env bash
# 拉起 APP 并等到 WebView 的 devtools socket 真的出现（不是 sleep 猜）。
ADB="C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DEV=emulator-5554
PKG=com.tdashcam.studio
"$ADB" -s $DEV shell am force-stop $PKG >/dev/null 2>&1
sleep 2
"$ADB" -s $DEV shell monkey -p $PKG -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
for i in $(seq 1 60); do
  PID=$("$ADB" -s $DEV shell pidof $PKG | tr -d '\r')
  if [ -n "$PID" ] && "$ADB" -s $DEV shell cat /proc/net/unix 2>/dev/null | grep -q "webview_devtools_remote_$PID"; then
    "$ADB" -s $DEV forward --remove tcp:9333 >/dev/null 2>&1
    "$ADB" -s $DEV forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null
    echo "ready pid=$PID after ${i}0s-ish"; exit 0
  fi
  sleep 2
done
echo "TIMEOUT: pid='$PID'"; exit 1

#!/usr/bin/env bash
# Bring a freshly (re)booted emulator back to a testable state: unlocked for `am start`, storage
# permission granted, app running, and the WebView devtools socket forwarded.
# A cold boot answers `am start` with "Too early to start activity" for minutes after
# sys.boot_completed flips, and the webview_devtools_remote_<pid> socket only appears 60-90s after
# the Activity is up — so each step polls for the effect it actually depends on.
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
export MSYS_NO_PATHCONV=1

adb wait-for-device
echo "DEVICE_SEEN $(adb shell uptime | tr -d '\r')"

for i in $(seq 1 60); do
    b=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    [ "$b" = "1" ] && { echo "BOOT_DONE attempt=$i"; break; }
    sleep 5
done

adb root >/dev/null 2>&1
sleep 3
adb wait-for-device
adb shell appops set --uid com.tdashcam.studio MANAGE_EXTERNAL_STORAGE allow 2>&1 | tr -d '\r'

for i in $(seq 1 60); do
    out=$(adb shell am start -n com.tdashcam.studio/.MainActivity 2>&1 | tr -d '\r' | paste -sd' ')
    if echo "$out" | grep -q "Starting:" && ! echo "$out" | grep -qE "Exception|Error"; then
        echo "LAUNCH_OK attempt=$i"
        break
    fi
    sleep 10
done

pid=""
for i in $(seq 1 30); do
    pid=$(adb shell pidof com.tdashcam.studio 2>/dev/null | tr -d '\r' | awk '{print $1}')
    [ -n "$pid" ] && break
    sleep 5
done
echo "APP_PID=${pid:-none}"
[ -z "$pid" ] && exit 1

for i in $(seq 1 30); do
    adb forward tcp:9333 localabstract:webview_devtools_remote_$pid >/dev/null 2>&1
    # `adb forward` succeeds for a socket that does not exist yet — only an answered /json/version
    # proves the WebView has actually opened its devtools pipe.
    ver=$(curl -s --max-time 6 http://127.0.0.1:9333/json/version 2>/dev/null | head -c 160)
    if [ -n "$ver" ]; then echo "CDP_UP $ver"; break; fi
    sleep 5
done

echo "READY uptime=$(adb shell uptime | tr -d '\r')"

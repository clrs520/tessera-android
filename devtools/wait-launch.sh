#!/usr/bin/env bash
# Wait for a wedged emulator to finish booting, launch the app, and report the WebView PID.
# Success is `am start` printing Starting: WITHOUT an exception — the guest answers "Too early to
# start activity" until the system user is unlocked, which the watchdog crash loop keeps resetting.
export PATH="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools:$PATH"
for i in $(seq 1 90); do
    out=$(adb shell am start -n com.tdashcam.studio/.MainActivity 2>&1 | tr -d '\r' | paste -sd' ')
    if echo "$out" | grep -q "Starting:" && ! echo "$out" | grep -qE "Exception|Error"; then
        pid=$(adb shell pidof com.tdashcam.studio 2>/dev/null | tr -d '\r' | awk '{print $1}')
        echo "LAUNCH_OK attempt=$i pid=$pid"
        exit 0
    fi
    sleep 10
done
echo "LAUNCH_FAILED $(adb shell uptime | tr -d '\r')"
exit 1

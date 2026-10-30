#!/usr/bin/env bash
# R98-C3: run the destructive flush against one fixture event, then put the fixture back.
# The folder is pulled before anything is deleted, so this test costs nothing permanent.
set -u
ADB="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DEV=emulator-5554
ROOT=/c/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998
BACKUP="$ROOT/devtools/tmp/r98-flush-backup"
FOLDER="${1:-2026-09-29_12-30-00}"
DIR="/storage/emulated/0/TeslaCam/SavedClips/$FOLDER"

run() { CDP_PID="$PID" CDP_TIMEOUT_MS=60000 node "$ROOT/devtools/cdp-eval.mjs" "$@"; }

PID=$(MSYS_NO_PATHCONV=1 $ADB -s $DEV shell pidof com.tdashcam.studio | tr -d '\r')
echo "pid=$PID folder=$FOLDER"
[ -z "$PID" ] && { echo "no app running"; exit 1; }
MSYS_NO_PATHCONV=1 $ADB -s $DEV forward tcp:9333 localabstract:webview_devtools_remote_$PID >/dev/null

echo "== 1. pre-delete file count on disk"
MSYS_NO_PATHCONV=1 $ADB -s $DEV shell "stat -c '%n' $DIR/*.mp4" 2>/dev/null | tr -d '\r' | wc -l

echo "== 2. pull the folder so this is reversible"
rm -rf "$BACKUP"; mkdir -p "$BACKUP"
MSYS_NO_PATHCONV=1 $ADB -s $DEV pull "$DIR" "$BACKUP/" 2>&1 | tail -1

echo "== 3. run the flush probe"
run --file "$ROOT/devtools/r98-flush.js" | tee "$ROOT/devtools/tmp/r98-flush.json"

echo "== 4. the clips really left the volume"
MSYS_NO_PATHCONV=1 $ADB -s $DEV shell "ls -1 $DIR 2>/dev/null" | tr -d '\r' | wc -l

echo "== 5. push them back"
MSYS_NO_PATHCONV=1 $ADB -s $DEV push "$BACKUP/$FOLDER" "$DIR" 2>&1 | tail -1
echo "   restored mp4 count:"
MSYS_NO_PATHCONV=1 $ADB -s $DEV shell "stat -c '%n' $DIR/*.mp4" 2>/dev/null | tr -d '\r' | wc -l

echo "== 6. rescan: the card must come back on its own"
run 'window.viewer.rescanCurrentFolder({ pullRefresh: true }).then(()=>"rescanned")'
sleep 8
run 'JSON.stringify({groups: window.viewer.eventGroups.length, back: window.viewer.eventGroups.some(e=>String(e.eventId).includes("2026-09-29_12-30-00"))})'

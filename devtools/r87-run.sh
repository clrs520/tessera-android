#!/usr/bin/env bash
# R87 engine-side run: clear logcat, drive the export from the page, then read back what the
# renderer said it painted. The area% in `TdExportCaption` and the area% quoted by the sheet are the
# same number computed twice, in two languages — that is the WYSIWYG claim being tested.
set -uo pipefail
cd "$(dirname "$0")/.."
ADB="/c/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe"
DEV=emulator-5554
OUT="${1:-devtools/r87-export.json}"

"$ADB" -s $DEV logcat -c
CDP_TIMEOUT_MS=420000 node devtools/cdp-eval.mjs --file devtools/r87-export.js > "$OUT" 2>&1
"$ADB" -s $DEV logcat -d -s TdExportCaption:I TdExport:E TdExportService:I > devtools/r87-logcat.txt 2>&1

echo "== probe =="; tail -c 1200 "$OUT"
echo; echo "== wm log =="; grep -c " wm " devtools/r87-logcat.txt; grep " wm " devtools/r87-logcat.txt | head -4

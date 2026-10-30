#!/bin/bash
# R99 regression pass: the suites written for earlier rounds, run against the build that carries the
# three layout fixes. Each one owns its own state, so they run in sequence and each is summarised on
# one line; a suite that fails gets its own investigation rather than being re-run hoping for green.
set -u
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PID=$(MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 shell pidof com.tdashcam.studio | tr -d '\r')
MSYS_NO_PATHCONV=1 "$ADB" -s emulator-5554 forward tcp:9333 "localabstract:webview_devtools_remote_$PID" >/dev/null
for f in "$@"; do
  echo "=== $f ==="
  CDP_PID="$PID" CDP_TIMEOUT_MS=300000 node devtools/cdp-eval.mjs --file "devtools/$f" > "/tmp/r99-reg-$f.out" 2>&1
  node -e '
    const fs=require("fs");const s=fs.readFileSync(process.argv[1],"utf8");
    let j; try { j=JSON.parse(s); } catch(e) { console.log("  (not JSON) "+s.replace(/\s+/g," ").slice(0,300)); process.exit(0); }
    const fails=j.fail||[];
    console.log(`  pass=${j.pass&&j.pass.length!==undefined?(j.pass.length||j.pass):(j.passes?j.passes.length:"?")} fail=${fails.length}`);
    fails.slice(0,8).forEach(f=>console.log("   FAIL "+String(f).slice(0,160)));
  ' "/tmp/r99-reg-$f.out"
done

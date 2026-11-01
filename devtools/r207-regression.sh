#!/usr/bin/env bash
# R207 回归批跑：每个套件之前**冷启动一次**（r207-verify 会把抽屉/长按/目录浏览器留在脏状态上，
# 上一轮实测：连着跑 r102-verify 会白捡 4 条 R118 的红 —— 抽屉里那一行根本没开起来）。
# 跑法：bash devtools/r207-regression.sh [套件名 ...]
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
PKG=com.tdashcam.studio
TMP=/c/Users/Xingcong/AppData/Local/Temp
SUITES=("${@:-}")
if [ -z "${*}" ]; then
  SUITES=(r203-verify.js r204-verify.js r205-verify.js r201-dragselect.js r186-batch-delete.js r185-scroll-chip.js r182-note.js r173-verify.js)
fi
MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "am force-stop com.liangqing.photos" >/dev/null
for f in "${SUITES[@]}"; do
  [ -f "devtools/$f" ] || { echo "== $f 不存在，跳过"; continue; }
  MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "pm enable $PKG; am force-stop $PKG; am start -n $PKG/.MainActivity" >/dev/null
  sleep 20
  echo "== $f"
  CDP_TIMEOUT_MS=400000 ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs --file "$(cygpath -w "devtools/$f")" > "$TMP/reg-$f.json" 2>&1
  node -e "
  const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');
  try{const o=JSON.parse(s);
    console.log('   pass='+(o.pass||[]).length+' fail='+(o.fail||[]).length+(o.threw?(' THREW '+o.threw):''));
    (o.fail||[]).forEach(x=>console.log('   x '+String(x).slice(0,150)));
  }catch(e){console.log('   RAW '+s.slice(0,200));}" "$(cygpath -w "$TMP/reg-$f.json")"
done
echo DONE

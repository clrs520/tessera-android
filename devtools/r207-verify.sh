# R203 第 5 批判据（R207）：禁用态读不读得清、焦点会不会跑到关不掉的面、命中区够不够、键盘起来顶不顶得动。
# 跑法：bash devtools/r207-verify.sh
#   两套页内判据 + 一次方向切换：
#     r207-verify.js    —— 竖屏那半边（四个禁用态中的三个、aria-selected 的 role、inert 名单、
#                          手势提示关闭与导出胶囊命中区、目录浏览器吃不吃 --kb-h）
#     r207-landscape.js —— 横屏那半边：`.filter-sheet-action` 这一对只在横屏的筛选整面里画出来
#                          （竖屏那一组走 `display: contents` 的另一套规则），拿隐藏节点量必假绿。
#   方向这一条按 R182 的教训写成三段：`accelerometer_rotation 0` → 先回 0 再置 1 → **只认 innerWidth**。
#   改前（1.2.331）必须红，改后必须绿。
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
TMP=/c/Users/Xingcong/AppData/Local/Temp
PKG=com.tdashcam.studio
run() { CDP_TIMEOUT_MS="${2:-240000}" ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs --file "$(cygpath -w "$1")" 2>&1 | tail -1; }
show() { node -e "
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');let o=null;
try{o=JSON.parse(s);}catch(e){console.log('RAW '+s.slice(0,200));process.exit(0);}
if(o.threw||o.fatal){console.log('THREW '+JSON.stringify(o).slice(0,200));process.exit(0);}
console.log(process.argv[2]+' pass='+(o.pass||[]).length+' fail='+(o.fail||[]).length+' notes='+JSON.stringify(o.notes||{}));
(o.fail||[]).forEach(x=>console.log('   x '+String(x).slice(0,120))); " "$(cygpath -w "$1")" "$2"; }
adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }

adb_run "pm enable $PKG >/dev/null; am force-stop com.liangqing.photos; am force-stop $PKG; am start -n $PKG/.MainActivity >/dev/null"
sleep 16
echo "== 1) 竖屏半边"
run devtools/r207-verify.js > "$TMP/r207-portrait.json"; show "$TMP/r207-portrait.json" "竖屏"
echo "== 2) 转横屏（只认 innerWidth）"
adb_run "settings put secure accelerometer_rotation 0; settings put system user_rotation 0"; sleep 3
adb_run "settings put system user_rotation 1"; sleep 7
D="$(CDP_TIMEOUT_MS=30000 ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs 'innerWidth+"x"+innerHeight' 2>&1 | tail -1)"
echo "   inner = $D"
case "$D" in 915x412*|*x412) : ;; *) echo "   横屏没落地 —— 横屏那半边按「未测」处理，不算通过";; esac
echo "== 3) 横屏半边"
run devtools/r207-landscape.js > "$TMP/r207-landscape.json"; show "$TMP/r207-landscape.json" "横屏"
adb_run "settings put system user_rotation 0"; sleep 4
echo "== 4) 复原（浅色主题已由判据自己写回；这里只确认字号/方向）"
adb_run "settings put system font_scale 1.0; settings put secure accelerometer_rotation 1"
echo DONE

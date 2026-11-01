# R208 第 1 批判据：桥的耗时台账（量具），以及这台机器上量不到的那一张数表。
# 跑法：bash devtools/r208-verify.sh
#   ① r208-verify.js     —— 台账本身：每条调用都记进账、排序、进得了「复制诊断」、门面没被计时改口。
#   ② r208-bridge-cost.js —— 每个同步方法在本机的 first/max/median（AVD 没有 OTG 卷 ⇒ 这是**下界**）。
#   改前（1.2.333）必须红：那一份没有台账，①里除「前置：这是安卓壳」以外全红；②本来就能跑，用来留基线。
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
TMP=/c/Users/Xingcong/AppData/Local/Temp
PKG=com.tdashcam.studio
adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }
run() { CDP_TIMEOUT_MS="${2:-180000}" ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs --file "$(cygpath -w "$1")" 2>&1 | tail -1; }
show() { node -e "
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');let o=null;
try{o=JSON.parse(s);}catch(e){console.log('RAW '+s.slice(0,200));process.exit(0);}
if(o.threw||o.fatal){console.log('THREW '+JSON.stringify(o).slice(0,300));process.exit(0);}
console.log(process.argv[2]+' pass='+(o.pass||[]).length+' fail='+(o.fail||[]).length+' notes='+JSON.stringify(o.notes||{}));
(o.fail||[]).forEach(x=>console.log('   x '+String(x).slice(0,140))); " "$(cygpath -w "$1")" "$2"; }

# 冷启动：台账要在「页面自己刚起过一次」的状态上读，所以每次都真的重开一遍 APP。
# `pm enable` 是本机现有的外部动作（第三方自动化反复把我们置成 enabled=3，`am start` 只回 Error type 3）。
adb_run "pm enable $PKG >/dev/null; am force-stop com.liangqing.photos; am force-stop $PKG; am start -n $PKG/.MainActivity >/dev/null"
sleep 18
echo "== 1) 台账判据（冷启动之后）"
run devtools/r208-verify.js > "$TMP/r208-ledger.json"; show "$TMP/r208-ledger.json" "台账"
echo "== 2) 每方法的耗时表（本机=下界；真机跑同一支才有决策数）"
run devtools/r208-bridge-cost.js > "$TMP/r208-cost.json"
node -e "
const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');let o=null;
try{o=JSON.parse(s);}catch(e){console.log('RAW '+s.slice(0,240));process.exit(0);}
if(!o.calls){console.log('THREW '+JSON.stringify(o).slice(0,240));process.exit(0);}
Object.keys(o.calls).forEach(k=>console.log('   '+k+' '+JSON.stringify(o.calls[k])));
console.log('   notes '+JSON.stringify(o.notes||{})); " "$(cygpath -w "$TMP/r208-cost.json")"
echo DONE

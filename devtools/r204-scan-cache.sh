# R203 第 2 批（扫描缓存那一半）：外部改盘之后，「下拉刷新」必须问到真目录，
# 不许拿封存索引（R199 的 sealed：同一次挂载连目录 mtime 都不问）当答案。
# 跑法：bash devtools/r204-scan-cache.sh
# 现场：/sdcard/TeslaCamR156 先扫「20 个事件目录」，再在盘外整棵换成「1 个目录 × 60 分钟」
#       （挂载设备号没变、我们自己也没删过东西 ⇒ 不会写 .dirty），最后比三次扫描的答案。
# 改前（1.2.328）红在「刷新仍答 sealed=true / 还是 20 个旧事件」；改后必须绿。
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
D=/sdcard/TeslaCamR156
P=/c/Users/Xingcong/AppData/Local/Temp/r204-cache-probe.js

adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }

make_probe() {  # $1 = refresh|plain|reset
  local opt=""
  [ "$1" = refresh ] && opt=", { pullRefresh: true }"
  local reset=""
  if [ "$1" = reset ]; then
    reset="await window.nativeInvoke('scan_index_dirty', { path: '$D' });"
  fi
  cat > "$P" <<EOF
(async () => {
  const v = window.viewer;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  // 冷启动自己会恢复上次目录并发一轮扫描；抢在它前面调用会被 scanToken 挡回 false，
  // 那时看到的是「上一轮留下的列表」，不是这一步的答案。等它扫完再动手。
  for (let i = 0; i < 200 && v.isScanning; i++) await sleep(300);
  $reset
  const loaded = await v.loadTauriDirectory('$D'$opt);
  await sleep(2500);
  const segs = (v.eventGroups || []).map(e => (e.segments || []).length);
  const st = v.lastScanStats || {};
  return JSON.stringify({
    loaded: !!loaded,
    groups: v.eventGroups.length,
    maxSeg: segs.length ? Math.max.apply(null, segs) : 0,
    sealed: st.sealed, dirsCached: st.dirsCached, statSkipped: st.statSkipped,
    firstFile: (v.allFiles && v.allFiles[0] && v.allFiles[0].webkitRelativePath) || ''
  });
})()
EOF
}

read_state() {
  ADB_SERIAL="$DEV" CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs --file "$(cygpath -w "$P")"
}

echo "== 0) 把盘换成「旧结构」：RecentClips 里 20 个「一分钟一个目录」的事件"
# 只动目录里的东西、不删 `RecentClips` 本身，而且不用 `rm -rf $D/RecentClips/*`：那条命令在
# adb shell 里被 MSYS 改写成了 `<git安装>/sdcard/...`，静默失败 ⇒ 盘上根本没换结构，
# 于是「刷新换没换列表」量的是夹具而不是缓存。
adb_run "mkdir -p $D/RecentClips; rm -f $D/RecentClips/*.mp4; i=0; while [ \$i -lt 20 ]; do d=\$(printf '2026-08-01_10-%02d-00' \$i); mkdir -p $D/RecentClips/\$d; for c in front back left_repeater right_repeater left_pillar right_pillar; do touch $D/RecentClips/\$d/\$d-\$c.mp4; done; i=\$((\$i+1)); done; sync"
# 夹具自己要说实话：`rm` 在 FUSE 上回过 `Bad address`（本轮实测），静默失败的话后面比的就不是缓存了。
echo "   夹具现在：目录 $(adb_run "ls -1 $D/RecentClips 2>/dev/null | grep -c 2026-08-01_10-") 个（要 20），平铺 mp4 $(adb_run "ls -1 $D/RecentClips/*.mp4 2>/dev/null | wc -l" | tr -d '\r') 个（要 0）"

echo "== 0b) 冷启动：基线不能带上一份清单起来"
# 上一轮就是栽在这里：夹具是**整棵删掉再建**的，而 APP 进程手里还握着删除前的列表，
# `loadTauriDirectory` 每一步都回 `loaded:false`、列表永远停在旧结构（实测基线读到 groups:21，
# 里面还带着盘上已经不存在的 2026-08-02_11-59-*）。`scan_index_dirty` 只清盘上的清单缓存，
# 清不掉进程内存里那份 ⇒ 基线之前先重开一次，让「看见基线」这件事从头发生。
adb_run "pm enable com.tdashcam.studio >/dev/null; am force-stop com.liangqing.photos; am force-stop com.tdashcam.studio; am start -n com.tdashcam.studio/.MainActivity >/dev/null"
sleep 20

echo "== 1) 等 APP 真的看见这份基线（顺带把缓存记成它）"
# APP 进程在 FUSE 上对刚被换过的目录会有一段旧视图（实测：`adb ls` 已经是新结构，APP 的扫描
# 还在交旧结构，~40 秒后才跟上）。所以基线要「等它自己看见」，不能假定改完立刻可见 ——
# 否则后面比的不是缓存，而是这个视图差。
make_probe reset
BASE=""
for i in 1 2 3 4 5 6 7 8 9 10; do
  BASE=$(read_state); echo "   等基线（$i）：$BASE"
  case "$BASE" in *'"groups":20'*) break;; esac
  sleep 6
done

echo "== 1b) 封存索引下的普通扫描（这一次允许还是旧答案）"
make_probe plain
OLD=$(read_state); echo "$OLD"

echo "== 2) 盘外新增一小时（车就是这么写的）：RecentClips 里多出 60 个平铺分钟"
# 顶层目录名不变；新增的是它里面的条目 —— 根目录 `read_dir` 每次都真读，所以「换到别的类目下」
# 那种改法测不出缓存，只有「同一个目录里多了东西」才是封存索引挡得住的形状。
adb_run "i=0; while [ \$i -lt 60 ]; do d=\$(printf '2026-08-02_11-%02d-00' \$i); for c in front back left_repeater right_repeater left_pillar right_pillar; do touch $D/RecentClips/\$d-\$c.mp4; done; i=\$((\$i+1)); done; sync"

echo "== 3) 普通扫描（不刷新）：这次允许还是旧答案 —— 它证明缓存真的在生效"
STALE=$(read_state); echo "$STALE"

echo "== 4) 下拉刷新：必须去问目录，答案换成新结构"
make_probe refresh
FRESH=$(read_state); echo "$FRESH"

node -e '
const [oldS, staleS, freshS] = process.argv.slice(1).map((s) => JSON.parse(s));
const out = { pass: [], fail: [] };
const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? "" : " = " + d));
ok("前置：基线扫出来是 20 个事件，且缓存已经记下这份清单（sealed=true）",
   oldS.groups === 20 && oldS.sealed === true, JSON.stringify(oldS));
ok("前置：不刷新时确实还在答封存索引（否则这一步没有可测性）",
   staleS.sealed === true && staleS.groups === 20 && staleS.loaded === false, JSON.stringify(staleS));
ok("R203 下拉刷新不再信封存索引（sealed=false）", freshS.sealed === false, freshS.sealed);
ok("R203 下拉刷新问到了盘上新增的一小时（20 个旧事件 + 1 个 60 段新事件）",
   freshS.groups === 21 && freshS.maxSeg === 60, `${freshS.groups}/${freshS.maxSeg}`);
ok("R203 下拉刷新真的换了列表（不是「没有变化」那条捷径）", freshS.loaded === true, freshS.loaded);
console.log(JSON.stringify(out, null, 1));
process.exit(out.fail.length ? 1 : 0);
' "$OLD" "$STALE" "$FRESH"

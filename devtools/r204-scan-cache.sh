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
  CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs --file "$(cygpath -w "$P")"
}

echo "== 0) 记账：先把缓存作废再扫一次，让「盘上的旧结构」成为缓存里的内容"
adb_run "rm -rf $D; mkdir -p $D/RecentClips; i=0; while [ \$i -lt 20 ]; do d=\$(printf '2026-08-01_10-%02d-00' \$i); mkdir -p $D/RecentClips/\$d; for c in front back left_repeater right_repeater left_pillar right_pillar; do touch $D/RecentClips/\$d/\$d-\$c.mp4; done; i=\$((\$i+1)); done"
make_probe reset
read_state >/dev/null

echo "== 1) 旧结构基线：RecentClips 里 20 个「一分钟一个目录」的事件"
make_probe plain
OLD=$(read_state); echo "$OLD"

echo "== 2) 盘外换成新结构：同一个 RecentClips 目录里改成 60 分钟的平铺文件"
echo "   （顶层目录名不变 —— 车的滚动缓冲区就是这样；换到别的类目下根目录一定会被 read_dir 看见，测不出缓存）"
adb_run "rm -rf $D; mkdir -p $D/RecentClips; i=0; while [ \$i -lt 60 ]; do d=\$(printf '2026-08-02_11-%02d-00' \$i); for c in front back left_repeater right_repeater left_pillar right_pillar; do touch $D/RecentClips/\$d-\$c.mp4; done; i=\$((\$i+1)); done"

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
ok("R203 下拉刷新问到了盘上的新结构（1 个 60 段事件）",
   freshS.groups === 1 && freshS.maxSeg === 60, `${freshS.groups}/${freshS.maxSeg}`);
ok("R203 下拉刷新真的换了列表（不是「没有变化」那条捷径）", freshS.loaded === true, freshS.loaded);
console.log(JSON.stringify(out, null, 1));
process.exit(out.fail.length ? 1 : 0);
' "$OLD" "$STALE" "$FRESH"

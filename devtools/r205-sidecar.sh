# R203 第 3 批 · F4 判据：`read_sidecars` 必须有字节上限。
# 跑法：bash devtools/r205-sidecar.sh
# 现场：一份 6 MiB 的 event.json（合法 JSON，只是塞了个巨大的 filler 字段）+ 一份正常的。
# 改前（1.2.329）红在「大那份 ok=true（整读进内存再解析）」；改后必须 ok=false + skipped=tooBig，
# 而且正常那份照常读出 city —— 上限不许把小文件一起挡掉。
# 之所以用 6 MiB 而不是几百 MiB：这台 AVD 只有 2.4 GB，真把它 OOM 掉就量不到别的东西了。
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
D=/sdcard/TeslaCamR205
P=/c/Users/Xingcong/AppData/Local/Temp/r205-sidecar.js

adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }
# 设备路径要挡住 MSYS 的 `/sdcard/…` → `<git安装>/sdcard/…` 改写
adb_push() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" push "$1" "$2" >/dev/null; }

echo "== 造夹具：SavedClips 两个事件，其中一个的 event.json 是 6 MiB"
BIG="$(cygpath -w /c/Users/Xingcong/AppData/Local/Temp/r205-big-event.json)"
SMALL="$(cygpath -w /c/Users/Xingcong/AppData/Local/Temp/r205-small-event.json)"
node -e '
const fs = require("fs");
fs.writeFileSync(process.argv[1], JSON.stringify({ city: "杭州", street: "滨江大道", filler: "x".repeat(6 * 1024 * 1024) }));
fs.writeFileSync(process.argv[2], JSON.stringify({ city: "杭州", street: "滨江大道", est_lat: "30.2", est_lon: "120.2", reason: "碰撞" }));
' "$BIG" "$SMALL"
adb_run "rm -rf $D; mkdir -p $D/SavedClips/2026-10-01_10-00-00 $D/SavedClips/2026-10-01_10-01-00" \
  && adb_push "$BIG" "$D/SavedClips/2026-10-01_10-00-00/event.json" \
  && adb_push "$SMALL" "$D/SavedClips/2026-10-01_10-01-00/event.json" \
  && adb_run "ls -l $D/SavedClips/*/event.json | awk '{print \$5, \$9}'"

cat > "$P" <<'EOF'
(async () => {
  const D = '/storage/emulated/0/TeslaCamR205/SavedClips';
  const big = D + '/2026-10-01_10-00-00/event.json';
  const small = D + '/2026-10-01_10-01-00/event.json';
  const rows = await window.nativeInvoke('read_sidecars', { paths: [big, small] });
  const [b, s] = rows || [];
  const out = { pass: [], fail: [] };
  const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + JSON.stringify(d)));
  ok('前置：两份都读到了回执（不是桥没答）', Array.isArray(rows) && rows.length === 2 && !!b && !!s, rows && rows.length);
  if (s.ok === false) throw new Error('夹具没落盘：正常那份 event.json 读不出来，「大那份被跳过」就没法归因');
  ok('F4 正常那份照常读出城市与坐标', !!s.city && !!s.lat, { city: s.city, lat: s.lat });
  ok('F4 超限那份被跳过（ok=false）', b.ok === false, { ok: b.ok, city: b.city });
  ok('F4 跳过要说明原因，不许静默当「没有这个文件」', b.skipped === 'tooBig', b.skipped);
  return JSON.stringify(out, null, 1);
})()
EOF

echo "== 判据"
CDP_TIMEOUT_MS=120000 node devtools/cdp-eval.mjs --file "$(cygpath -w "$P")"

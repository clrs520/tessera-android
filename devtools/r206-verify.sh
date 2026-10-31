# R203 第 4 批判据：原生这一层的生命周期，任务和服务要对得上。
# 跑法：bash devtools/r206-verify.sh
#   N6 activity 每次重建（改系统字号会重建）泄漏一条 ThumbFetcher 的线程池线程 —— volume/state 两个池
#      在 onDestroy 里 shutdownNow 了，thumbFetcher 是 lazy 的、没人关。数 /proc/<pid>/task 里
#      `pool-N-thread-1` 就知道堆了几条。前置是「先真的取到一帧」，否则那条线程根本没生出来。
#   N4 导出进度节流用 `System.currentTimeMillis()` ⇒ 中途校时（往回拨）把 `now - lastReportAt` 变成负数，
#      进度回报从此不再发出。量的是「每秒几条回报」而不是「百分比走到哪」：1.2.330 实测拨钟前 1.63 条/秒
#      → 拨钟后 0.13 条/秒，而百分比还在爬（15→46→49→100）—— 只看百分比会漏判；终点回执是绕过节流
#      直接发布的，所以每个采样点都要钉住 `job===true`，且两段窗口都得在稳态里。
#   N3 服务被系统/用户停掉（`am stopservice`）只释放唤醒锁、不取消任务 ⇒ 编码线程还在烧 CPU，而进程
#      已经没有前台身份：随时会被杀，文件停在半截。停服务之后任务必须收手（拿到 cancelled），通知不许还挂着。
#   N5 进程半路死掉（`am force-stop`）留下的是 MediaMuxer 已经 opened 的正式文件名 —— 一个没有 moov、
#      相册里 0 秒、点开报错的 .mp4 孤儿。改完应该只有 `.part`。
#   另加两条不回归：导出期间服务真的有前台身份；中途拨了钟这一单仍然成功产出。
# 改前（1.2.330）必须红，改后必须绿。设备侧动作（拨钟 / 停服务 / 杀进程）都在本脚本里，页内只负责
# 起作业与采样，所以每一步都能重跑。
# 素材：/sdcard/TeslaCamR206 —— 4 路 × 15 s 的 **screenrecord 真片**（脚本自己录，约 70 s；已有就跳过）。
# 3 s 的短片 10 s 就编完，量不到「中途」；0 字节的 touch 夹具解不动，导出会被整批判「全黑」（R180）。
# 判据里的值一律经 $TMP/r206-values 传给 node：`VAR=值 node` 这种写法会被 MSYS 把 `/storage/...`
# 改写成 `<git 安装目录>/storage/...`（本轮实测踩过），文件内容才不动。
set -o pipefail
cd "$(dirname "$0")/.." || exit 1
ADB="${ADB:-C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe}"
DEV="${DEV:-emulator-5554}"
TMP=/c/Users/Xingcong/AppData/Local/Temp
# 每个进程一套临时文件。上一轮踩过：改脚本时前一轮还在跑（bash 边读边执行，直接语法错在半路），
# 两轮共用 `$TMP/r206-probe.js` ⇒ 一份被另一轮写歪的 JS 喂进 WebView，症状是 SyntaxError: await
# 只在 async 里合法，而真正的原因是并发。名字带 pid 之后两轮最多抢设备，不会抢文件。
P="$TMP/r206-probe-$$"
R="$TMP/r206-assert-$$"
VALS="$TMP/r206-values-$$"
trap 'rm -f "$P" "$R" "$VALS"' EXIT
# 同一台设备不允许两个夹具在跑（拨钟 / 停服务 / 杀进程互相抢前台，测出来的全是假数）。
# 本机没有 pgrep，所以用 `mkdir` 的原子性做锁；一轮跑满约 12 分钟，留 40 分钟当僵尸锁的宽限。
LOCK="$TMP/r206.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  AGE=$(( $(date +%s) - $(stat -c %Y "$LOCK" 2>/dev/null || echo 0) ))
  if [ "$AGE" -lt 2400 ]; then
    echo "!! 另一轮 r206-verify.sh 正在跑（锁 $LOCK，$((AGE / 60)) 分钟前建的）—— 先等它结束" >&2
    exit 1
  fi
  echo "   锁已经 $((AGE / 60)) 分钟没动，按僵尸锁接管" >&2
  rm -rf "$LOCK"; mkdir "$LOCK" || exit 1
fi
trap 'rm -rf "$LOCK"; rm -f "$P" "$R" "$VALS"' EXIT
PKG=com.tdashcam.studio
SVC="$PKG/$PKG.ExportService"
FIX=/sdcard/TeslaCamR206
REG=/storage/emulated/0/TeslaCamR206
: > "$VALS"

adb_run() { MSYS_NO_PATHCONV=1 "$ADB" -s "$DEV" shell "$@"; }
probe() { cat > "$P" <<PEOF
$1
PEOF
  CDP_TIMEOUT_MS="${2:-60000}" ADB_SERIAL="$DEV" node devtools/cdp-eval.mjs --file "$(cygpath -w "$P")"; }
keep() { printf '%s\t%s\n' "$1" "$2" >> "$VALS"; }
pool_count() { adb_run "PID=\$(pidof $PKG); [ -z \"\$PID\" ] && { echo -1; exit 0; }; n=0; for t in /proc/\$PID/task/*; do c=\$(cat \$t/comm 2>/dev/null); case \"\$c\" in pool-*) n=\$((n+1));; esac; done; echo \$n"; }
fgs_count() { adb_run "dumpsys activity services $PKG | grep -A6 ExportService | grep -c 'isForeground=true'"; }
# 采样器读出来的那一条（含作业是否还在跑）
tail_probe() { probe '(async () => { const s = (window.__r206 && window.__r206.samples) || []; const t = s[s.length-1] || null; return JSON.stringify({ percent: t && t.percent, frames: t && t.frames, n: s.length, term: window.__r206 && window.__r206.term && window.__r206.term.phase, job: !!window.viewer.peJob }); })()' 30000; }

# 起跑模板：把 __CAMERAS__ 换成相机集合。这一步一律用**这一盘能给的每一路**（实测 4 路）：
# 单路 3 s 的片子 10 s 就编完了，量不到「中途」，拨钟 / 停服务 / 杀进程都要在作业还在跑的时候动手。
START_JS='
(async () => {
  const v = window.viewer, sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40 && !window.viewer; i++) await sleep(400);
  if (v.peJob) { v.cancelPhoneExport(); for (let i = 0; i < 40 && v.peJob; i++) await sleep(500); }
  window.__r206 = { samples: [], term: null, outPath: "" };
  const orig = v.onPhoneExportProgress.__r206raw || v.onPhoneExportProgress.bind(v);
  const hook = (p) => {
    try {
      if (p && typeof p.percent === "number") window.__r206.samples.push({ t: Math.round(performance.now()), percent: p.percent, frames: p.frames });
      if (p && ["done", "cancelled", "error"].includes(p.phase)) window.__r206.term = p;
    } catch (e) {}
    return orig(p);
  };
  hook.__r206raw = orig;
  v.onPhoneExportProgress = hook;
  const ev = (v.eventGroups || []).find(e => (e.segments || []).length);
  if (!ev) return JSON.stringify({ fatal: "no events in fixture" });
  if (!v.currentEvent) { await v.playEvent(ev.eventId); for (let i = 0; i < 120 && !(v.videoControls.totalDuration > 0); i++) await sleep(250); }
  const vw = Math.max.apply(null, Object.keys(v.players || {}).map(k => (v.players[k] && v.players[k].videoWidth) || 0).concat([0]));
  const vc = v.videoControls;
  vc.clipStartTime = 0; vc.clipEndTime = vc.totalDuration || 3;
  await v.showPhoneExportModal(); await sleep(600);
  v.peSelection.cameras = __CAMERAS__;
  v.peSelection.overlay = Object.assign({}, v.peSelection.overlay, { chrome: false, labels: false, watermark: false, mosaic: false });
  v.renderPhoneExportPanel(); await sleep(400);
  const plan = v.phoneExportPlan();
  if (plan.error) return JSON.stringify({ fatal: plan.error });
  await v.startPhoneExport();
  for (let i = 0; i < 60 && !v.peJob; i++) await sleep(100);
  window.__r206.outPath = (v.peJob && v.peJob.outPath) || "";
  const cams = (v.peSelection.cameras || []).length;
  return JSON.stringify({ started: !!v.peJob, outPath: window.__r206.outPath, total: vc.totalDuration, vw, cams });
})()'

all_cams() { printf '%s' "${START_JS/__CAMERAS__/v.phoneExportCameras().slice(0, 6)}"; }

echo "== 0a) 夹具：一份 15 秒 × 4 路的**真片**事件（没有就现录，录一次约 70 s）"
HAVE="$(adb_run "ls -1 $FIX/SavedClips/*/ 2>/dev/null | grep -c '\.mp4$'")"
if [ "${HAVE:-0}" -lt 4 ]; then
  E="$FIX/SavedClips/2026-10-31_10-00-00"
  adb_run "rm -rf $FIX; mkdir -p $E"
  for cam in front back left_repeater right_repeater; do
    # screenrecord 是本机没有 ffmpeg 时唯一的真片来源（R180 起就用它）；录出来的文件有 moov，
    # 0 字节的 touch 夹具解不动，导出会整批被判「全黑」。
    adb_run "screenrecord --time-limit 15 --bit-rate 6000000 $E/2026-10-31_10-00-00-$cam.mp4"
  done
  adb_run "sync"
  echo "   录好了：$(adb_run "ls -l $E | awk '{print \$5, \$9}' | tr '\n' ' '")"
else
  echo "   已有 $HAVE 个文件，跳过录制"
fi

echo "== 0b) 前置：APP 在前台、真片解得动、取到一帧（ThumbFetcher 的线程得先生出来）"
adb_run "am force-stop $PKG; am start -n $PKG/.MainActivity >/dev/null"
sleep 16
PREP="$(probe '(async () => {
  const v = window.viewer, sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40 && !window.viewer; i++) await sleep(400);
  for (let i = 0; i < 200 && window.viewer.isScanning; i++) await sleep(300);
  if (window.viewer.lastScannedPath !== "'"$REG"'") {
    await window.viewer.loadTauriDirectory("'"$REG"'");
    for (let i = 0; i < 200 && window.viewer.isScanning; i++) await sleep(300);
  }
  const f = (window.viewer.allFiles || []).find(x => x && /\\.mp4$/i.test(x.name || ""));
  // 路径要拿产品自己算的那一份：`firstClipPath` 在列表组件上（卡片就是用它排队取帧的），
  // 直接喂 `file.path`/`webkitRelativePath` 可能是相对名 —— 原生解不出图，
  // 「ThumbFetcher 真的跑过」这个前置就永远是假的（本轮实测踩过：gotFrame 一直 false）。
  const ev0 = (window.viewer.eventGroups || [])[0];
  const list = window.viewer.videoListComponent;
  const path = (ev0 && list && list.firstClipPath(ev0))
    || (document.querySelector('[data-frame-path]') || {}).dataset?.framePath
    || (f && (f.path || f.webkitRelativePath));
  let frame = null;
  if (path) { try { frame = await FrameFetcher.get(path, 1, 160); } catch (e) { frame = "threw:" + e.message; } }
  for (let i = 0; i < 20 && !(window.__r206 && window.__r206.done); i++) await sleep(200);
  return JSON.stringify({ path: window.viewer.lastScannedPath, groups: (window.viewer.eventGroups || []).length,
    file: path, gotFrame: !!frame && String(frame).indexOf("data:image") === 0, len: frame ? String(frame).length : 0 });
})()' 180000)"
echo "   $PREP"; keep PREP "$PREP"
sleep 4
T0="$(pool_count)"
echo "   T0（基线线程数，取过一帧之后）=$T0"
keep T0 "$T0"

ASK_JS='(async () => {
  const v = window.viewer, sleep = (ms) => new Promise(r => setTimeout(r, ms));
  for (let i = 0; i < 40 && !window.viewer; i++) await sleep(400);
  for (let i = 0; i < 200 && window.viewer.isScanning; i++) await sleep(300);
  const ev = (window.viewer.eventGroups || [])[0];
  const list = window.viewer.videoListComponent;
  const p = ev && list && list.firstClipPath(ev);
  let got = null;
  if (p) { try { got = await FrameFetcher.get(p, 1, 160); } catch (e) { got = null; } }
  return JSON.stringify({ asked: !!p, got: !!got });
})()'

echo "== 1) N6 三次重建（改系统字号会重建 activity —— 但「重建」这件事要自己证明，否则差=0 是白捡的）"
RC=0
for i in 1 2 3; do
  probe "(async () => { window.__r206gen = 'g$i'; return 'set'; })()" 20000 >/dev/null
  adb_run "settings put system font_scale $([ $((i % 2)) -eq 1 ] && echo 1.15 || echo 1.0)"
  sleep 12
  probe "$ASK_JS" 60000 >/dev/null
  ALIVE="$(probe '(async () => JSON.stringify({ gen: window.__r206gen || "gone" }))()' 20000)"
  case "$ALIVE" in
    *'"gen":"gone"'*) RC=$((RC + 1)); echo "   第 $i 次：页面换了 ⇒ activity 真的重建了";;
    *) echo "   第 $i 次：页面还是那一份 ⇒ 这一次没重建（$ALIVE）";;
  esac
done
adb_run "settings put system font_scale 1.0"; sleep 12
T1="$(pool_count)"
echo "   T1（重建 $RC 次之后）=$T1"
keep T1 "$T1"; keep RC "$RC"

# 页面活着吗？连 `1+1` 都要 25 秒不回的 WebView，后面每一步都会「超时 ⇒ 空串 ⇒ 判据读不到值」。
# 本轮实测：第 1 步那三次重建跑完，AVD 上的 JS 线程就不动了（进程在、焦点在、socket 在，
# 唯独页面不回）。这不是判据要测的东西，但它会让整轮变成一串假的「前置不成立」。
alive() { [ "$(probe '(() => "yes")()' 25000)" = "yes" ]; }
revive() { adb_run "settings put system font_scale 1.0; am force-stop $PKG; am start -n $PKG/.MainActivity >/dev/null"; sleep 20; }

echo "== 2) N4 多路导出 + 墙钟回拨 2 小时：进度回报的频率不许塌掉"
if alive; then :; else echo "   页面不回话 ⇒ 重启 APP 再起量（这一支只修工具，不改结论）"; revive; fi
adb_run "rm -f /sdcard/Download/Tessera_2026-10-31_10-00-00_0.0-20.5s_4c_928x2048*" >/dev/null
START="$(probe "$(all_cams)" 180000)"; echo "   $START"; keep START "$START"
OUT="$(printf '%s' "$START" | sed -n 's/.*"outPath":"\([^"]*\)".*/\1/p')"
# 拨钟必须落在**稳态**里，而且两段窗口都要落在**作业还活着**的那一段时间里。
# 第一版落在开头（T+2 起量）⇒ 引擎还没热，4 秒只出 2 条回报，拿它当基线比的是噪声（误红）；
# 第二版用 shell 轮询（每轮 probe ~2 s + sleep 5 s）等百分比 ≥ 20 ⇒ 真看见时已经 46 %，
# 后一段 8 秒直接跨过终点（1.2.330 上 78 → done）⇒ 「作业还在跑」这条前置也红。
# 现在等百分比这件事在页内做（250 ms 一次，采样钩子本来就在页内），一到 12 % 立刻起量。
# 量的仍是「回报的条数」而不是百分比：1.2.330 上墙钟倒退把 `now - lastReportAt` 变成负数，
# 回报从此不发；但 AVD 过一会儿会把钟对回宿主机，百分比在更晚的窗口里又追上来 —— 只看百分比会漏判。
W0="$(probe '(async () => {
  const st = window.__r206, s = st.samples, sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const last = () => (s.length ? s[s.length - 1].percent : 0);
  for (let i = 0; i < 900 && !st.term && last() < 12; i++) await sleep(250);
  return JSON.stringify({ percent: last(), n: s.length, job: !!window.viewer.peJob, term: st.term && st.term.phase });
})()' 240000)"; echo "   等到稳态 $W0"; keep W0 "$W0"
A0="$(tail_probe)"; echo "   稳态起点 $A0"; keep A0 "$A0"
sleep 8
A="$(tail_probe)"; echo "   拨钟前 $A"; keep A "$A"
adb_run "settings put global auto_time 0; date -s '2026-10-31 10:00:00'" >/dev/null
sleep 8
B="$(tail_probe)"; echo "   拨钟后 $B"; keep B "$B"
JUMPED="$(adb_run "date '+%H:%M'")"; echo "   设备钟面 = $JUMPED"
keep JUMPED "$JUMPED"
FGSN="$(fgs_count)"; FGSJOB="$(tail_probe)"; echo "   期间前台的 ExportService 记录 = $FGSN（取这一数时作业 = $FGSJOB）"; keep FGSN "$FGSN"; keep FGSJOB "$FGSJOB"
sleep 8
C="$(tail_probe)"; echo "   再等一轮 $C"; keep C "$C"
adb_run "settings put global auto_time 1; date -s '$(date -u '+%Y-%m-%d %H:%M:%S')'" >/dev/null

echo "== 3) 等这一单跑完（中途拨了钟也得成功）"
DONE='{}'
for i in $(seq 1 24); do
  DONE="$(tail_probe)"
  case "$DONE" in *'"term":"'*) break;; esac
  sleep 6
done
echo "   $DONE"; keep DONE "$DONE"

echo "== 4) N3 服务被停掉：任务要收手、通知要撤"
START2="$(probe "$(all_cams)" 180000)"; echo "   $START2"; keep START2 "$START2"
sleep 15
BEFORE_STOP="$(tail_probe)"; echo "   停之前 $BEFORE_STOP"; keep BEFORE_STOP "$BEFORE_STOP"
adb_run "am stopservice $SVC"
sleep 18
STOP="$(probe '(async () => {
  const s = (window.__r206 && window.__r206.samples) || [], t = window.__r206 && window.__r206.term;
  return JSON.stringify({ n: s.length, last: s.length ? s[s.length-1].percent : null,
    job: !!window.viewer.peJob,
    term: t ? { phase: t.phase, code: t.code, frames: t.frames, path: (t.path || "").split("/").pop() } : null });
})()' 30000)"
echo "   停服务之后 $STOP"; keep STOP "$STOP"
NOTI="$(fgs_count)"; echo "   还挂着前台的 ExportService = $NOTI"; keep NOTI "$NOTI"
if [ "$(printf '%s' "$STOP" | sed -n 's/.*"job":true.*/Y/p')" = "Y" ]; then adb_run "am stopservice $SVC"; fi

echo "== 5) N5 进程半路死掉：不许留同名 .mp4 孤儿"
# 第一版在这里误红：它拿「作业起点算出来的正式名」去目录里 grep，可第 3 步那一单**真的成功了**，
# 目录里本来就该有那个 .mp4 —— 把上一次的成功产物当成这一次的孤儿。
# 现在先把本夹具的产物清空，并且把「起跑前的清单」和「杀完之后的清单」都记下来做差集。
adb_run "rm -f /sdcard/Download/Tessera_2026-10-31_10-00-00_0.0-20.5s_4c_928x2048*" >/dev/null
LIST_JS="ls -1 /sdcard/Download 2>/dev/null | grep -F 'Tessera_2026-10-31_10-00-00_0.0-20.5s_4c_928x2048' | tr '\\n' ';'"
BEFORE_LIST="$(adb_run "$LIST_JS")"; echo "   起跑前目录里：[$BEFORE_LIST]"; keep BEFORE_LIST "$BEFORE_LIST"
START3="$(probe "$(all_cams)" 180000)"; echo "   $START3"; keep START3 "$START3"
OUT3="$(printf '%s' "$START3" | sed -n 's/.*"outPath":"\([^"]*\)".*/\1/p')"
keep OUT3 "$OUT3"
sleep 15
BEFORE_KILL="$(tail_probe)"; echo "   杀之前 $BEFORE_KILL"; keep BEFORE_KILL "$BEFORE_KILL"
adb_run "am force-stop $PKG"
sleep 3
DIR3="${OUT3%/*}"; BASE3="${OUT3##*/}"
ORPHAN="$(adb_run "ls -1 '$DIR3' 2>/dev/null | grep -F '$BASE3' | tr '\n' ';'" 2>&1)"
echo "   杀进程后那个目录里叫得出这名的：[$ORPHAN]"; keep ORPHAN "$ORPHAN"
PARTS="$(adb_run "ls -1 '$DIR3' 2>/dev/null | grep -F '$BASE3.part' | tr '\n' ';'")"
echo "   其中 .part（这些是给 JS 过滤掉的，不算产物）：[$PARTS]"; keep PARTS "$PARTS"
adb_run "am start -n $PKG/.MainActivity >/dev/null"; sleep 12

echo "== 6) 判据"
cat > "$R" <<'NODE'
const fs = require('fs');
const raw = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const v = {};
raw.forEach((line) => { const i = line.indexOf('\t'); if (i > 0) v[line.slice(0, i)] = line.slice(i + 1); });
const j = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };
const prep = j(v.PREP) || {}, start = j(v.START) || {}, done = j(v.DONE) || {}, stop = j(v.STOP) || {};
const a0 = j(v.A0) || {}, a = j(v.A) || {}, b = j(v.B) || {}, c = j(v.C) || {};
const beforeStop = j(v.BEFORE_STOP) || {}, beforeKill = j(v.BEFORE_KILL) || {}, start3 = j(v.START3) || {};
const t0 = Number(v.T0), t1 = Number(v.T1);
const pct = (o) => (o && typeof o.percent === 'number' ? o.percent : null);
const out = { pass: [], fail: [], notes: {} };
const ok = (n, cond, d) => (cond ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
const running = (o) => o.job === true && !o.term;
const rate = (x, y, secs) => (((y.n || 0) - (x.n || 0)) / secs);
const pre = rate(a0, a, 8), post = rate(a, b, 8);

ok('前置：取到了一帧原生图（ThumbFetcher 真的跑过）', prep.gotFrame === true, JSON.stringify(prep));
ok('前置：两次线程数都读到了（-1 = 进程没了）', t0 >= 1 && t1 >= 0, `T0=${t0} T1=${t1}`);
ok('前置：拨钟那一单是多路、而且采样窗口里作业都还在跑', (start.cams || 0) >= 2 && running(a0) && running(a) && running(b), JSON.stringify([start.cams, a0.job, a.job, b.job]));
ok('前置：设备钟面确实被拨回去了（否则 N4 测的是没发生的事）', /^10:0/.test(v.JUMPED || ''), v.JUMPED);
ok('前置：停服务之前那一单还在跑（否则「收手」没得测）', running(beforeStop), JSON.stringify(beforeStop));
ok('前置：杀进程那一单还在跑、且写出了真实路径', running(beforeKill) && !!v.OUT3, JSON.stringify([beforeKill.job, v.OUT3]));

ok('前置：activity 真的被重建了（页面换了一份）—— 否则这条线程账测的是没发生过的事', Number(v.RC) >= 2, `重建 ${v.RC} 次`);
ok('N6 activity 重建不泄漏线程池线程（每次重建净增 0）', t1 - t0 <= 0, `${t0} → ${t1}，重建 ${v.RC} 次`);
// 基线窗口本身要有料：稳态里 8 秒若只出 1～2 条，比值是噪声（本轮第一版就是这么误红的）。
ok('前置：拨钟前的稳态窗口里回报够密（否则「频率塌没塌」比的是噪声）', pre >= 0.4,
   `拨钟前 8 秒 ${a.n - a0.n} 条 = ${pre.toFixed(2)} 条/秒｜百分比 ${pct(a0)}→${pct(a)}`);
ok('N4 墙钟回拨 2 小时之后，进度回报的频率不许塌掉', pre >= 0.4 && post >= 0.4 * pre, `拨钟前 ${pre.toFixed(2)} 条/秒 → 拨钟后 ${post.toFixed(2)} 条/秒｜百分比 ${pct(a0)}→${pct(a)}→${pct(b)}→${pct(c)}`);
ok('N4 中途校时不许把导出打断（这一单仍然 done）', done.term === 'done', JSON.stringify(done));
ok('N3 服务被停掉之后任务要收手（拿到 cancelled 回执，而不是照常跑完）', stop.term && stop.term.phase === 'cancelled', JSON.stringify(stop.term));
ok('N3 服务被停掉之后不许还挂着前台通知', Number(v.NOTI) === 0, v.NOTI);
// N5 只认「这一单新写出来的文件」：起跑前目录里本来就有上一单成功产物，把它算成孤儿是判据的错。
const seen = (v.BEFORE_LIST || '').split(';').filter(Boolean);
const after = (v.ORPHAN || '').split(';').filter(Boolean);
const fresh = after.filter((n) => seen.indexOf(n) < 0);
ok('前置：杀进程那一单确实往盘上写了东西（否则「不留孤儿」是白捡的）', fresh.length >= 1,
   JSON.stringify({ before: seen, fresh, parts: v.PARTS }));
ok('N5 进程半路死掉不留 .mp4 孤儿（新出现的只许是 .part）', fresh.every((n) => /\.part$/.test(n)),
   JSON.stringify({ fresh, parts: (v.PARTS || '').split(';').filter(Boolean) }));
// 前台身份这一条要在「作业真的还在跑」的时候取，否则服务已经自己下了，读到 0 说的是别的事。
ok('前置：取前台身份那一刻作业确实还在跑', running(j(v.FGSJOB) || {}), v.FGSJOB);
ok('不回归：导出期间 ExportService 真的有前台身份', Number(v.FGSN) >= 1, v.FGSN);
console.log(JSON.stringify(out, null, 1));
process.exit(out.fail.length ? 1 : 0);
NODE
node "$R" "$(cygpath -w "$VALS")"

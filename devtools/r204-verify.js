// R203 第 2 批判据：R200 的后台补量有没有把尺交到「真正用尺的人」手里。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r204-verify.js
// 夹具：/sdcard/TeslaCamR204/RecentClips（150 分钟 × 6 路、全部 0 字节 ⇒ 扫描一段都量不到、
//       全部留给后台补量；`probe_durations` 由本判据代答 42 s，好让「补量算出的数」有唯一来源）。
//   注意是「一个目录里的平铺文件」：事件按「文件所在目录」归并（script.js:15990），
//   一分钟一个目录会得到 150 个单段事件，补量根本不会跑。
//   建夹具（外部改动要用 `scan_index_dirty` 或下拉刷新才看得见，见 r204-scan-cache.sh）：
//   adb shell "rm -rf /sdcard/TeslaCamR204; mkdir -p /sdcard/TeslaCamR204/RecentClips;
//     i=0; while [ $i -lt 150 ]; do h=$((i/60)); m=$((i%60));
//     d=$(printf '2026-10-30_%02d-%02d-00' $h $m);
//     for c in front back left_repeater right_repeater left_pillar right_pillar;
//     do touch /sdcard/TeslaCamR204/RecentClips/${d}-${c}.mp4; done; i=$((i+1)); done"
// 改前（1.2.328）必须红，改后必须绿。
(async () => {
  const v = window.viewer;
  const out = { pass: [], fail: [], notes: {} };
  const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const A = '/sdcard/TeslaCamR204';
  const real = window.nativeInvoke;
  const calls = [];
  // 补量的第一批故意让桥失败（100 条以上才是补量的批，入口段那一次只有 1 条）：
  // 只有「失败之后还继续跑并把它捡回来」才量得出 A5。
  window.nativeInvoke = function (cmd, args) {
    if (cmd !== 'probe_durations') return real.apply(this, arguments);
    const n = (args && args.paths && args.paths.length) || 0;
    calls.push(n);
    if (n >= 100 && calls.filter(x => x >= 100).length === 1) {
      return Promise.reject(new Error('stubbed bridge failure'));
    }
    return Promise.resolve(args.paths.map(() => 42000));
  };
  try {
    await v.loadTauriDirectory(A);
    await sleep(2500);
    const ev = (v.eventGroups || []).find((e) => (e.segments || []).length > 60);
    if (!ev) throw new Error(`夹具没并成一个 >60 段的大事件（最大 ${(v.eventGroups || []).map(e => (e.segments || []).length).sort((a, b) => b - a)[0]} 段）`);
    out.notes.segments = ev.segments.length;
    v.playEvent(ev.eventId);
    await sleep(15000);                       // 画面起来 + 2.5 s 后开跑的几批
    const p = v.continuousPlayer;
    const vc = v.videoControls;
    const bigCalls = calls.filter((n) => n >= 100);
    out.notes.calls = calls.slice();
    out.notes.measured = ev.segments.filter((s) => s.duration > 0).length;
    ok('前置：播放器确实停在这个事件上', p.currentEvent === ev);
    ok('A5 拒绝之后还要问下一批（补量问过两批以上）', bigCalls.length >= 2, bigCalls.join(','));
    ok('A5 桥偶尔拒绝不该终止整轮，那一批还要捡回来（全段量到）',
      out.notes.measured === ev.segments.length, `${out.notes.measured}/${ev.segments.length}`);
    // A1 不能只等补量跑完再比：补量整个停在第一批时，两边都还是 60 s 的旧尺，一比就「相等」＝白捡通过。
    // 所以这里由判据亲手改一段的时长、再叫产品自己重建一次尺，问「用尺的人跟着动了吗」。
    const probeIndex = 3;
    ev.segments[probeIndex].duration = 42;
    await v.rebuildRulerInPlace(ev);
    await sleep(200);
    ok('A1 补量的尺交到了播放器实例（同一份数组，不是各算一份）',
      p.segmentDurations === ev.segmentDurations && p.segmentStartTimes === ev.segmentStartTimes,
      `dur=${p.segmentDurations === ev.segmentDurations} start=${p.segmentStartTimes === ev.segmentStartTimes}`);
    ok('A1 播放器实例看到的是改过的那一段（42 s，不是 60 s 猜值）',
      Math.abs((p.segmentDurations[probeIndex] || 0) - 42) < 0.01, p.segmentDurations[probeIndex]);
    ok('A1 播放器总长 = 重建后的事件总长',
      Math.abs(p.getTotalDuration() - ev.totalDuration) < 0.5,
      `player=${Math.round(p.getTotalDuration())} event=${Math.round(ev.totalDuration)}`);
    ok('A1 控件条总长也跟上', Math.abs(vc.totalDuration - ev.totalDuration) < 0.5,
      `controls=${Math.round(vc.totalDuration)}`);

    // A2：补量重建尺不许把用户刚拉好的剪辑区间冲掉（rebookAxis 早就挡了这一刀）
    vc.clipModeActive = true;
    vc.clipStartTime = 100;
    vc.clipEndTime = 160;
    await v.rebuildRulerInPlace(ev);
    await sleep(300);
    ok('A2 剪辑态下重建尺不冲掉入出点',
      vc.clipStartTime === 100 && vc.clipEndTime === 160,
      `${vc.clipStartTime}/${vc.clipEndTime}`);
    ok('A2 剪辑态挡下的那次重建记成欠账（退出剪辑会补）',
      v.rulerRebuildDeferred === ev, String(v.rulerRebuildDeferred && v.rulerRebuildDeferred.eventId));
    vc.clipModeActive = false;
    vc.clipStartTime = null;
    vc.clipEndTime = null;
    v.rulerRebuildDeferred = null;
  } catch (e) {
    out.fail.push('判据本身出错: ' + ((e && e.message) || e));
  } finally {
    window.nativeInvoke = real;
  }
  return JSON.stringify(out, null, 1);
})()

// R203 第 3 批判据：扫描「失败了」这条路有没有把人踩脏。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r205-verify.js
//   F1 `loadTauriDirectory` 的 catch 在 `await scannedPathGone()` 之后无条件写回
//      `lastScannedPath` / `eventGroups` —— token 只在 await 之前查过一次 ⇒ 一次迟到的失败
//      回滚会把用户刚切好的目录和列表盖掉（R143 那套归属检查没覆盖 catch 里这两支）。
//   F2 `scanPoll`（500 ms 的 `scan_progress` 轮询）只在扫描成功返回后清；扫描抛异常就漏在那儿，
//      之后每一次扫描的进度行都可能被它翻回「已扫描 N」。
//   F3 流式扫描先把媒体服务白名单换成新目录（预览图要它），`result?` 提前返回就换不回来
//      ⇒ 选一个读不了的文件夹失败后，**正在用的那个目录全部 403**，界面还停在旧列表。
// 安全：F3 只回 HTTP 状态码，不把流媒体 token 写进任何输出。
// 改前（1.2.329）必须红，改后必须绿。
(async () => {
  const v = window.viewer;
  const out = { pass: [], fail: [], notes: {} };
  const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const GOOD = '/storage/emulated/0/TeslaCamReg';
  const NEXT = '/storage/emulated/0/TeslaCamMulti';
  const DEAD = '/storage/emulated/0/TeslaCamR205NoSuchDir';
  const origGone = v.scannedPathGone;
  const origScan = v.nativeScanFiles;
  const goneCalls = [];
  let progressCalls = 0;
  const realInvoke = window.nativeInvoke;
  try {
    // ---- 前置：好目录扫得开、里面的文件流媒体服务认（拿状态码，不碰 token）----
    await v.loadTauriDirectory(GOOD);
    await sleep(1500);
    ok('前置：好目录扫出事件了', v.eventGroups.length > 0, v.eventGroups.length);
    const oneFile = (v.allFiles || []).find(f => f && f.name && f.name.endsWith('.mp4'));
    if (!oneFile) throw new Error('夹具里没有可请求的 mp4');
    const url = window.getFileUrl(oneFile);
    const probe = async () => {
      // 只问状态码；GET + Range 比 HEAD 稳（流媒体服务对 HEAD 未必单独处理）。
      try { const r = await fetch(url, { headers: { Range: 'bytes=0-0' } }); return r.status; } catch (e) { return -1; }
    };
    const allowed = (s) => s === 200 || s === 206;
    const before = await probe();
    ok('前置：正在用的目录，媒体服务放行（200/206）', allowed(before), before);

    // ---- F3：扫一个不存在的目录 ⇒ 原生在 read_dir 就报错 ⇒ 白名单必须换回来 ----
    let threw = false;
    try { await v.nativeScanFiles(DEAD, { streamPreview: false }); } catch (e) { threw = true; }
    ok('前置：死目录确实让扫描抛了（否则 F3 没有现场）', threw);
    const after = await probe();
    ok('F3 扫描失败后，原来那个目录仍然放行（白名单换回来了）', allowed(after), after);

    // ---- F1/F2：让 A 卡在 catch 的 await 里， meanwhile B 完整提交 ----
    window.nativeInvoke = function (cmd, args) {
      if (cmd === 'scan_progress') progressCalls += 1;
      return realInvoke.apply(this, arguments);
    };
    v.scannedPathGone = async function (p, options) {
      goneCalls.push(p);
      await sleep(4000);                       // 足够 B 走完并提交
      return true;                             // 「这个文件夹已经不在了」——失败回滚那一支
    };
    v.nativeScanFiles = async function (p, opts) {
      if (String(p) === DEAD) { await sleep(150); throw new Error('stubbed scan failure'); }
      return origScan.call(this, p, opts);
    };
    const beforeA = { path: v.lastScannedPath, groups: v.eventGroups };
    const promiseA = v.loadTauriDirectory(DEAD);
    await sleep(400);                           // A 已经抛了，正卡在 scannedPathGone
    const retB = await v.loadTauriDirectory(NEXT);   // B：新 token、另一个目录、另一份列表
    // 前置必须在 A 醒来之前量：A 一醒就会把路径与列表盖回去，那正是这一步要测的东西。
    const groupsB = v.eventGroups;
    ok('前置：B 确实提交了（回报落地、路径与列表都是新的）',
      retB !== false && v.lastScannedPath === NEXT && groupsB !== beforeA.groups,
      `${v.lastScannedPath} / ${v.eventGroups.length} 条`);
    ok('前置：A 真的进了「目录不见了」那一支', goneCalls.indexOf(DEAD) >= 0, goneCalls.join(','));
    const retA = await promiseA;
    ok('F1 迟到的失败回滚不再盖掉当前目录', v.lastScannedPath === NEXT, `${v.lastScannedPath}`);
    ok('F1 迟到的失败回滚不再盖掉当前列表', v.eventGroups === groupsB);
    ok('F1 迟到的那次调用如实回报「我没落地」', retA === false, String(retA));

    // ---- F2：失败的那次扫描留下的轮询，不该还在打 IPC ----
    progressCalls = 0;
    const fakeStatus = document.createElement('div');   // 漏掉的轮询靠这个元素才发得出 IPC
    v.scanStatusEl = fakeStatus;
    await sleep(1600);
    v.scanStatusEl = null;
    ok('F2 扫描抛异常后没有留下 500 ms 的进度轮询', progressCalls === 0, progressCalls);
  } catch (e) {
    out.fail.push('判据本身出错: ' + ((e && e.message) || e));
  } finally {
    v.scannedPathGone = origGone;
    v.nativeScanFiles = origScan;
    window.nativeInvoke = realInvoke;
    v.scanStatusEl = null;
  }
  return JSON.stringify(out, null, 1);
})()

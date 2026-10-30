(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const BIG = '/storage/emulated/0/TeslaCam';
  const RACE = '/storage/emulated/0/TeslaCamRace';
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const load = async (path) => { v.lastScanSignature = null; return v.loadTauriDirectory(path); };

  // ── 1. 目录浏览器：一次迟到的失败导航不得擦掉健康目录 ──────────────────────────
  try {
    v.androidBrowseTo('/storage/emulated/0/QoderNope');
    v.androidBrowseTo(BIG);
    await new Promise(r => setTimeout(r, 7000));
    const rows = document.querySelectorAll('#androidDirList .dir-browser-item').length;
    add('browse-late-error-keeps-healthy-folder',
        rows > 0 && !v.dirBrowseGone && v.androidBrowsePath === BIG,
        { rows, gone: !!v.dirBrowseGone, browsePath: v.androidBrowsePath,
          hint: getComputedStyle(document.getElementById('androidDirHint')).display !== 'none' });
  } catch (e) {
    add('browse-late-error-keeps-healthy-folder', false, String(e));
  }

  // ── 2. 撤销：切了目录之后不得把别的盘的事件插进当前列表 ────────────────────────
  try {
    await load(RACE);
    const ev = v.eventGroups[0];
    const targets = v.allFiles.map(f => f.path);
    v.pendingDelete = { event: ev, targets };
    await v.confirmDeleteEvent();
    const job = v.pendingDeleteUndo;
    clearTimeout(job.timer);                    // never unlink: this test must not destroy files
    await load(BIG);
    const before = v.eventGroups.length;
    v.undoDelete(job);
    await new Promise(r => setTimeout(r, 500));
    const foreign = v.eventGroups.filter(g => String(g.eventId).startsWith('TeslaCamRace')).length;
    const foreignFiles = v.allFiles.filter(f => String(f.path).includes('TeslaCamRace')).length;
    add('undo-stays-in-its-own-folder', foreign === 0 && foreignFiles === 0,
        { groupsBefore: before, groupsAfter: v.eventGroups.length, foreignCards: foreign,
          foreignFiles, lastScannedPath: v.lastScannedPath });
  } catch (e) {
    add('undo-stays-in-its-own-folder', false, String(e));
  }

  // ── 3. 扫描：慢的那一趟不得覆盖后完成的新目录 ─────────────────────────────────
  // The delay only stands in for "the first folder's rebuild is still running"; every commit
  // after it is the shipped path. It has to be released by the *second* folder's commit: a fixed
  // sleep loses the ordering to the native scan's own jitter, and the stale commit then never
  // actually lands last (measured on 1.2.220: A entered, slept, and B still finished after it).
  try {
    const proto = Object.getPrototypeOf(v);
    const orig = proto.handleFolderSelection;
    let entered = false, waitedForB = false;
    let release;
    const bDone = new Promise(r => { release = r; });
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    v.handleFolderSelection = async function (files, token) {
      // `BIG + '/'` because TeslaCamRace also starts with the TeslaCam prefix.
      const isBig = String((files[0] || {}).path || '').startsWith(BIG + '/');
      if (!isBig) {
        entered = true;
        waitedForB = true;
        await Promise.race([bDone, sleep(6000)]);
      }
      const out = await orig.call(this, files, token);
      if (!isBig) release();
      return out;
    };
    // Without this the first folder answers "no change" from the fingerprint, never reaches the
    // rebuild at all, and the check passes for doing nothing.
    v.lastScanSignature = null;
    const a = v.loadTauriDirectory(BIG);
    const t = Date.now();
    while (!entered && Date.now() - t < 12000) await sleep(20);
    const b = v.loadTauriDirectory(RACE);
    await b;
    await a;
    await sleep(600);
    delete v.handleFolderSelection;
    const roots = [...new Set(v.eventGroups.map(g => String(g.eventId).split('/')[0]))];
    add('stale-scan-cannot-overwrite',
        entered && waitedForB && v.lastScannedPath === RACE && roots.length === 1 && roots[0] === 'TeslaCamRace',
        { entered, waitedForB, lastScannedPath: v.lastScannedPath, roots, groups: v.eventGroups.length });
  } catch (e) {
    add('stale-scan-cannot-overwrite', false, String(e));
  }

  // leave the device on the real folder
  await load(BIG);
  const failed = checks.filter(c => !c.pass).length;
  return JSON.stringify({ version: document.querySelector('#appVersion')?.textContent?.trim() || '',
    total: checks.length, failed, checks }, null, 1);
})()

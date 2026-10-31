// R203 第一批判据：拖选三条 + 删除脏标记落错根。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r203-verify.js
//   （G1 会真的删掉 /sdcard/TeslaCamR203 里的一条事件，跑前补夹具：
//    for d in 2026-10-12_10-00-00 2026-10-12_10-01-00 2026-10-12_10-02-00; do
//      adb shell mkdir -p /sdcard/TeslaCamR203/SavedClips/$d;
//      for c in front back left right left_pillar right_pillar; do
//        adb shell touch /sdcard/TeslaCamR203/SavedClips/$d/${d}-${c}.mp4; done; done）
// 改前（1.2.327）必须红；改后必须绿。每条都断言产品行为，不断言实现细节。
(async () => {
  const v = window.viewer;
  const out = { pass: [], fail: [], notes: {} };
  const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const A = '/sdcard/TeslaCamR203';
  const B = '/sdcard/TeslaCamReg';
  const restore = [];
  const spy = (obj, key, rec) => {
    const old = obj[key];
    obj[key] = function (...args) { rec.push(args); return old.apply(this, args); };
    restore.push(() => { obj[key] = old; });
  };

  try {
    // ---------- G1 删除的脏标记必须落在「文件被删的那个根」上 ----------
    // 夹具会被删掉，跑前先补回来（见文件头的 adb 命令），并让 R199 的清单缓存作废。
    await window.nativeInvoke('scan_index_dirty', { path: A }).catch(() => {});
    await v.loadTauriDirectory(A);
    await sleep(1200);
    const dirty = [];
    const realInvoke = window.nativeInvoke;
    const oldInvoke = window.nativeInvoke;
    window.nativeInvoke = function (cmd, args) {
      if (cmd === 'scan_index_dirty') dirty.push(args && args.path);
      return realInvoke.apply(this, arguments);
    };
    restore.push(() => { window.nativeInvoke = oldInvoke; });

    const victim = (v.eventGroups || []).find((e) => v.eventOwnFolder(e));
    out.notes.victim = victim ? victim.eventId : null;
    if (!victim) throw new Error('夹具里没有自带文件夹的事件，G1 无法判定');
    const targets = [];
    for (const seg of victim.segments) for (const f of Object.values(seg.files || {})) targets.push(f);
    // 用户视角：在 A 里删掉这一条，撤销保险丝还没烧完就切去了 B。
    v.armDeleteUndo({ items: [{ event: victim, index: v.eventGroups.indexOf(victim) }], targets });
    ok('G1 保险丝挂上时记下了来源目录', v.pendingDeleteUndo && v.pendingDeleteUndo.folderPath === A,
      v.pendingDeleteUndo && v.pendingDeleteUndo.folderPath);
    v.lastScannedPath = B;
    await v.flushPendingDelete();
    ok('G1 脏标记落在被删的那个根（不是当前目录）', dirty.length === 1 && dirty[0] === A, JSON.stringify(dirty));
    restore.forEach((f) => f()); restore.length = 0;

    // ---------- G2 边缘自动滚必须按时间走，不按帧 ----------
    await v.loadTauriDirectory('/sdcard/TeslaCamMulti');
    await sleep(1000);
    v.setSelectionMode(true);
    v.toggleSidebar(true);
    await sleep(700);
    const list = document.getElementById('fileList');
    out.notes.scrollable = [list.scrollHeight, list.clientHeight];
    const fire = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch',
      isPrimary: true, clientX: x, clientY: y, buttons: 1,
    }));
    const realRaf = window.requestAnimationFrame.bind(window);
    const realCancel = window.cancelAnimationFrame.bind(window);
    const rateWith = (frameMs) => new Promise((resolve) => {
      window.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), frameMs);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      list.scrollTop = 0;
      const cards = [...list.querySelectorAll('.video-card')];
      const r0 = cards[2].getBoundingClientRect();
      const lr = list.getBoundingClientRect();
      fire('pointerdown', cards[2], r0.left + 40, r0.top + r0.height / 2);
      setTimeout(() => {
        // 把手指停在底缘带里，让自动滚跑满 1.2 s
        fire('pointermove', list, r0.left + 40, lr.bottom - 20);
        const t0 = performance.now();
        const s0 = list.scrollTop;
        setTimeout(() => {
          const pxPerSec = (list.scrollTop - s0) / ((performance.now() - t0) / 1000);
          fire('pointerup', list, r0.left + 40, lr.bottom - 20);
          window.requestAnimationFrame = realRaf;
          window.cancelAnimationFrame = realCancel;
          resolve(pxPerSec);
        }, 1200);
      }, 320);
    });
    const fast = await rateWith(16);
    const slow = await rateWith(48);
    v.setSelectionMode(false);
    out.notes.edgeRate = [Math.round(fast), Math.round(slow)];
    ok('G2 慢帧率下滚速没有按比例掉（步长由时间导出）',
      fast > 0 && slow > 0 && Math.max(fast, slow) / Math.min(fast, slow) < 1.35,
      `16ms=${Math.round(fast)}px/s 48ms=${Math.round(slow)}px/s`);
    ok('G2 自动滚速度在可用区间（300–900 px/s）', fast >= 300 && fast <= 900, Math.round(fast));

    // ---------- G3 anchor 认事件，不认下标 ----------
    // anchor 放在第 0 张，并把 3 条别的事件挪到最前：按下标算的 anchor 会指向另一条事件，
    // 只有「anchor 记 eventId、每次按 id 重算下标」才可能同时满足下面两条。
    await sleep(400);
    v.setSelectionMode(true);
    await sleep(400);
    const cards = [...list.querySelectorAll('.video-card')];
    const anchorEvent = v.lastFilteredEvents[0] && v.lastFilteredEvents[0].eventId;
    const ra = cards[0].getBoundingClientRect();
    fire('pointerdown', cards[0], ra.left + 40, ra.top + ra.height / 2);
    await sleep(320);
    const activeNow = v.dragSelectState && v.dragSelectState.active;
    // 拖选中途列表被整表重排（扫描批次 / 换排序都会这样）：把末尾 3 条挪到最前
    const moved = [];
    for (let i = 0; i < 3; i += 1) moved.unshift(v.lastFilteredEvents.pop());
    v.lastFilteredEvents.unshift(...moved);
    const target = cards[6].getBoundingClientRect();
    fire('pointermove', list, target.left + 40, target.top + 8);
    await sleep(120);
    const sel = new Set(v.selection);
    fire('pointerup', list, 0, 0);
    v.cancelDragSelect();
    v.setSelectionMode(false);
    out.notes.g3 = {
      activeNow, anchorEvent, movedIds: moved.map((m) => m && m.eventId), size: sel.size,
    };
    ok('G3 拖选确认已起（前置成立）', activeNow === true, activeNow);
    ok('G3 重排后 anchor 仍是原来那条事件', sel.has(anchorEvent), anchorEvent);
    ok('G3 挤到前面的事件没被当成 anchor 勾上',
      moved.every((m) => !sel.has(m.eventId)), [...sel].join(','));

    // ---------- G3c 整表重画时必须收手（anchor 那张卡的节点已经不在了） ----------
    v.setSelectionMode(true);
    await sleep(400);
    const cards2 = [...list.querySelectorAll('.video-card')];
    const rb = cards2[1].getBoundingClientRect();
    fire('pointerdown', cards2[1], rb.left + 40, rb.top + rb.height / 2);
    await sleep(320);
    const painting = v.dragSelectState && v.dragSelectState.active;
    v.filterAndRender();               // 扫描批次 / 换排序 / 改筛选都会走到这里
    await sleep(120);
    const stillPainting = v.dragSelectState && v.dragSelectState.active;
    const stuckClass = list.classList.contains('drag-selecting');
    fire('pointerup', list, rb.left + 40, rb.top + 200);
    v.cancelDragSelect();
    v.setSelectionMode(false);
    out.notes.g3c = { painting, stillPainting, stuckClass };
    ok('G3c 重画前确实在画选（前置成立）', painting === true, painting);
    ok('G3c 整表重画后拖选立即结束，不留 drag-selecting',
      stillPainting === false && stuckClass === false, `${stillPainting}/${stuckClass}`);

    // ---------- G4 拖选期间不得触发下拉刷新 ----------
    await v.loadTauriDirectory('/sdcard/TeslaCamMulti');
    await sleep(900);
    v.setSelectionMode(true);
    v.toggleSidebar(true);
    await sleep(600);
    const rescans = [];
    spy(v, 'rescanCurrentFolder', rescans);
    const spinner = document.getElementById('ptrSpinner');
    list.scrollTop = 0;
    const c3 = list.querySelectorAll('.video-card')[3];
    const r3 = c3.getBoundingClientRect();
    const touch = (type, y) => {
      const t = { identifier: 0, target: c3, clientX: r3.left + 40, clientY: y };
      c3.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [new Touch(t)],
        targetTouches: type === 'touchend' ? [] : [new Touch(t)],
        changedTouches: [new Touch(t)],
      }));
    };
    touch('touchstart', r3.top + 6);
    fire('pointerdown', c3, r3.left + 40, r3.top + r3.height / 2);
    await sleep(320);
    const dragging = v.dragSelectState && v.dragSelectState.active;
    touch('touchmove', r3.top + 200);
    await sleep(80);
    const grew = spinner && parseFloat(spinner.style.height || '0') > 0;
    touch('touchend', r3.top + 200);
    await sleep(400);
    fire('pointerup', list, r3.left + 40, r3.top + 200);
    v.cancelDragSelect();
    v.setSelectionMode(false);
    restore.forEach((f) => f()); restore.length = 0;
    out.notes.g4 = { dragging, spinnerHeight: spinner && spinner.style.height, rescans: rescans.length };
    ok('G4 拖选确认已起（前置成立）', dragging === true, dragging);
    ok('G4 拖选期间刷新指示器没有胀起来', !grew, spinner && spinner.style.height);
    ok('G4 拖选抬手没有触发重扫', rescans.length === 0, rescans.length);
  } catch (e) {
    out.fail.push('判据本身出错: ' + ((e && e.message) || e));
  } finally {
    restore.forEach((f) => { try { f(); } catch (e) { /* already back */ } });
  }
  return JSON.stringify(out, null, 1);
})()

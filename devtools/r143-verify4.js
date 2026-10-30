// R143 第四批（P3 #16–#18）判据：能喂受控输入的都喂，喂不动的明说是「代码可证」。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const zh = /[\u4e00-\u9fff]/;
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // `FrameFetcher` 是脚本顶层的 const（不挂 window），但和 `i18n` 一样在全局词法作用域里可见。
  const ff = (typeof FrameFetcher !== 'undefined') ? FrameFetcher : null;

  // ── #17 取帧 id 带每页前缀（旧页的答复不能被新页同名 id 认领）────────────────
  {
    const target = ff || (v.thumbFetcher || null);
    let ids = [], shape = null, distinct = null;
    if (!target || typeof target.grabNative !== 'function') {
      add('#17 取帧桥存在', false, 'no FrameFetcher.grabNative');
    } else {
      const before = Object.keys(target.nativePending || {}).length;
      target.grabNative('/storage/emulated/0/__none__.mp4', 1, 160, () => {});
      target.grabNative('/storage/emulated/0/__none__.mp4', 2, 160, () => {});
      ids = Object.keys(target.nativePending || {}).slice(before, before + 2);
      ids.forEach(id => { delete target.nativePending[id]; });
      shape = ids[0] || null;
      // 每页一个随机前缀：两个 id 必须共享同一个前缀，且前缀不是纯数字序号
      const m = /^f([0-9a-z]{3,})-(\d+)$/.exec(shape || '');
      const m2 = /^f([0-9a-z]{3,})-(\d+)$/.exec(ids[1] || '');
      distinct = !!(m && m2 && m[1] === m2[1] && m[2] !== m2[2]);
      add('#17 id 带每页前缀且序号递增', distinct, { ids: ids });
    }
  }

  // ── #18b 引擎不再认得的作业必须有终态（进程被强停后不许永远卡在「导出中」）────
  {
    const had = v.peJob;
    const hadPill = v.pePercent;
    v.peJob = { id: 999999, outPath: '/storage/emulated/0/Download/__phantom__.mp4', at: Date.now() - 60000 };
    v.pePercent = 37;
    // 不先刷 pill 的话「pillShown=false」是白捡的通过 —— 判据要自己造出「正卡在导出中」的现场。
    v.updateExportPill();
    const planted = !!(v.dom.exportPill && v.dom.exportPill.classList.contains('show'));
    await v.syncExportFromNative();
    await sleep(400);
    const cleared = v.peJob === null;
    const pillShown = !!(v.dom.exportPill && v.dom.exportPill.classList.contains('show'));
    add('#18b 幻影作业被收尾成终态', planted && cleared && !pillShown,
      { planted, cleared, pillShown, percent: v.pePercent });
    // 刚点下去的作业不许被这条收尾误杀（startExport 与首个进度之间有几拍空窗）
    v.peJob = { id: 999998, outPath: '', at: Date.now() };
    await v.syncExportFromNative();
    await sleep(300);
    const freshKept = !!v.peJob;
    add('#18b 刚开始的作业不被误杀', freshKept, { freshKept });
    v.peJob = had; v.pePercent = hadPill;
  }

  // ── #18a 引擎的时长上限要有话说得出（新码必须组词得出来，不许回落成引擎原句）──
  {
    if (typeof v.engineText !== 'function') {
      add('#18a 新码有词', false, 'no engineText');
    } else {
      v.setLanguage('en'); await sleep(400);
      const en = v.engineText({ code: 'tooLong', message: 'raw detail', hours: 6 });
      const enLost = v.engineText({ code: 'lost' });
      v.setLanguage('zh'); await sleep(400);
      const cn = v.engineText({ code: 'tooLong', message: 'raw', hours: 6 });
      const cnLost = v.engineText({ code: 'lost' });
      add('#18a tooLong/lost 两种语言都组得出词',
        en !== 'raw detail' && !zh.test(en) && en.includes('6') && enLost.length > 0
          && zh.test(cn) && cn.includes('6') && cnLost.length > 0,
        { en, enLost, cn, cnLost });
    }
  }

  const failed = checks.filter(c => !c.pass);
  return JSON.stringify({ total: checks.length, pass: checks.length - failed.length,
    failed: failed.map(c => c.name), checks }, null, 1);
})()

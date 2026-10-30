// R143 第三批（P2 #10–#15）验收：单元式判据。
// 这台 AVD 的起播不可靠（totalDuration=0、20 s 遇不到换段、纠偏器没有漂移可纠），
// 所以每条判据都直接喂受控输入给出厂函数，不依赖播放器真的跑起来。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const zh = /[\u4e00-\u9fff]/;
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const mcp = v.multiCameraPlayer, ctl = v.videoControls, cp = v.continuousPlayer;

  // ── #10 长按 3× 不再被纠偏器打回 1× ────────────────────────────────────────────
  {
    const had = { rate: mcp.playbackRate, transient: mcp.transientRate,
                  stats: mcp.feedStats && mcp.feedStats.front };
    let eff = null, tol = null, kept = null, cleared = null;
    if (typeof mcp.effectiveRate === 'function') {
      mcp.playbackRate = 1; mcp.transientRate = 3;
      eff = mcp.effectiveRate();
      tol = +(0.35 * mcp.effectiveRate()).toFixed(4);
      const front = document.getElementById('front-player');
      if (front) {
        mcp.feedStats.front = { gliding: true };
        front.playbackRate = 3;
        mcp.endFeedGlide('front', front);
        kept = front.playbackRate;
      }
      mcp.transientRate = null;
      cleared = mcp.effectiveRate();          // 松开后必须回到记住的那一档
    }
    mcp.playbackRate = had.rate; mcp.transientRate = had.transient;
    if (mcp.feedStats) mcp.feedStats.front = had.stats;
    // `cleared` 是在测试自己把 playbackRate 写成 1 之后读的，所以「松开后回到记住的那一档」
    // 只能对着「当时的 playbackRate」比 —— 拿 had.rate 比是判据自己的顺序错。
    add('#10 effectiveRate 认得住的那一下', eff === 3 && cleared === 1,
      { effectiveRate: eff, afterRelease: cleared, remembered: had.rate });
    add('#10 纠偏容差随倍速放大', tol === 1.05, { toleranceAt3x: tol });
    add('#10 glide 收尾不再抹掉 3×', kept === 3, { writtenBack: kept });
  }

  // ── #11 A–B 循环不再吞掉显式 seek ──────────────────────────────────────────────
  {
    const had = { loopAB: ctl.loopAB, viewerLoopAB: v.loopAB, a: ctl.clipStartTime, b: ctl.clipEndTime,
                  dur: ctl.totalDuration, last: ctl.loopABLastTime, seeking: ctl.loopABSeeking };
    const realGet = cp.getCurrentTime.bind(cp);
    const realSeek = cp.seekToTime.bind(cp);
    let sought = [];
    cp.seekToTime = async t => { sought.push(t); return true; };
    // 闸门读的是 `viewer.loopAB`（不是控件自己那一份），漏设会得到「两条都过」的假绿
    v.loopAB = true; ctl.loopAB = true; ctl.clipStartTime = 20; ctl.clipEndTime = 40; ctl.totalDuration = 100;
    ctl.loopABSeeking = false;
    try {
      // 用户把进度条拖到 55 s：下一次 timeupdate 不许弹回 20 s
      cp.getCurrentTime = () => 55;
      // (a) 真拖动会走 applySeek，它把读数重钉到落点 —— 下一拍不许再回环
      ctl.loopABLastTime = 55;
      await ctl.maybeLoopAB();
      const afterSeek = sought.slice();
      // (b) 没有经过 applySeek 的大跳（段重载、fling）：一拍之内从 5 蹦到 55 不是「播过出点」
      sought = [];
      cp.getCurrentTime = () => 40.2;
      ctl.loopABLastTime = 39.8;
      await ctl.maybeLoopAB();
      const loops = sought.slice();
      sought = [];
      cp.getCurrentTime = () => 55;
      ctl.loopABLastTime = 5;
      await ctl.maybeLoopAB();
      const bigJump = sought.slice();
      add('#11a 拖动落点已重钉 ⇒ 不回环', afterSeek.length === 0, { seekAfterSeek: afterSeek });
      add('#11b 一拍内的大跳不算「播过出点」', bigJump.length === 0, { seekAfterRawJump: bigJump });
      add('#11c 正常越界仍然回环', loops.length === 1 && loops[0] === 20, { seekTo: loops });
    } finally {
      cp.getCurrentTime = realGet; cp.seekToTime = realSeek;
      Object.assign(ctl, { loopAB: had.loopAB, clipStartTime: had.a, clipEndTime: had.b,
        totalDuration: had.dur, loopABLastTime: had.last, loopABSeeking: had.seeking });
      v.loopAB = had.viewerLoopAB;
    }
  }

  // ── #12 换段瞬间 UA 自暂停不打回共享 isPlaying ────────────────────────────────
  {
    const had = { shared: mcp.isPlaying, own: ctl.isPlaying, trans: cp.isTransitioning, seam: mcp.seam };
    cp.isTransitioning = true; mcp.seam = true;
    mcp.isPlaying = true; ctl.isPlaying = true;
    ctl.updatePlayState(false);
    const keptPlaying = mcp.isPlaying === true;
    cp.isTransitioning = false; mcp.seam = false;
    ctl.updatePlayState(false);
    const releasedAfterSeam = mcp.isPlaying === false;
    add('#12 衔接期自暂停不写共享位', keptPlaying && releasedAfterSeam,
      { keptPlaying, releasedAfterSeam });
    mcp.isPlaying = had.shared;
    ctl.updatePlayState(had.own);            // 让图标/常亮/音频焦点回到自洽状态
    cp.isTransitioning = had.trans; mcp.seam = had.seam;
  }

  // ── #13 可访问名跟随语言（走真 setLanguage，不许走捷径）───────────────────────
  {
    const ids = ['metaFoldBtn', 'progressContainer', 'fullscreenBtn', 'statsResizeHandle',
      'phoneActionBar', 'peCloseBtn', 'peStartInput', 'peEndInput', 'peMarkName',
      'pePreviewCanvas', 'peZoomBtn', 'peZoomClose', 'jsErrorClose',
      'filterToggleBtn', 'clearDateBtn'];
    const nameOf = id => {
      const el = document.getElementById(id);
      if (!el) return null;
      return el.getAttribute('aria-label') || el.getAttribute('title') || '';
    };
    // 注意：不读字典（`const i18n` 不挂在 window 上，读它会 ReferenceError 装作通过），
    // 只问「英文页面上这个名字里还有汉字吗」。
    const taggedAll = [...document.querySelectorAll('[data-i18n-aria]')];
    const snapshot = () => ids.reduce((acc, id) => { acc[id] = nameOf(id); return acc; }, {});

    const zhBefore = snapshot();
    v.setLanguage('en'); await sleep(700);
    const enAfter = snapshot();
    const tagged = taggedAll.filter(el => zh.test(el.getAttribute('aria-label') || ''))
      .map(el => (el.id || el.tagName) + '=' + el.getAttribute('aria-label'));
    const stillChinese = ids.filter(id => enAfter[id] && zh.test(enAfter[id]))
      .map(id => id + '=' + enAfter[id]);
    const foldChanged = zhBefore.metaFoldBtn !== enAfter.metaFoldBtn;
    const fullChanged = zhBefore.fullscreenBtn !== enAfter.fullscreenBtn;
    const barName = enAfter.phoneActionBar;
    const tagNames = enAfter.filterToggleBtn + '|' + enAfter.clearDateBtn;
    const tagCount = taggedAll.length;
    v.setLanguage('zh'); await sleep(500);
    const backToZh = ids.filter(id => !zh.test(nameOf(id) || 'x')).map(id => id + '=' + nameOf(id));

    add('#13 属性挂上了（不是只改判据）', tagCount >= 13, { tagCount });
    add('#13 英文下没有中文可访问名', stillChinese.length === 0, stillChinese);
    add('#13 data-i18n-aria 全部落地', tagged.length === 0, tagged);
    add('#13 状态型名字（折叠 / 全屏）也跟随', foldChanged && fullChanged,
      { foldChanged, fullChanged });
    add('#13 两个图标按钮有真名字', barName === 'Main actions' && !zh.test(tagNames) && tagNames !== '|',
      { barName, tagNames });
    add('#13 切回中文不留英文尾巴', backToZh.length === 0, backToZh);
  }

  // ── #14 引擎错误串换成机器码 + 页面组词 ────────────────────────────────────────
  {
    if (typeof v.engineText !== 'function') {
      add('#14 页面侧组词函数存在', false, 'no engineText');
    } else {
      v.setLanguage('en'); await sleep(400);
      const noEnc = v.engineText({ code: 'noEncoder', message: 'no H.264 encoder can do 1920x1080: x', w: 1920, h: 1080 });
      const busy = v.engineText({ code: 'busy' });
      const prog = v.engineText({ code: 'progress', step: 42, frames: 189 });
      const tail = v.engineText({ code: 'tailStuck', frames: 189 });
      const unknown = v.engineText({ code: 'notYetKnown', message: 'engine detail' });
      const none = v.engineText({ message: 'plain note' });
      add('#14 英文下给出英文并带数字',
        !zh.test(noEnc) && noEnc.includes('1920') && noEnc.includes('1080')
          && busy === 'An export is already running' && prog.includes('42/189'),
        { noEnc, busy, prog });
      add('#14 未知码 / 无码回落引擎原句', unknown === 'engine detail' && none === 'plain note',
        { unknown, none });
      v.setLanguage('zh'); await sleep(400);
      const zhNoEnc = v.engineText({ code: 'noEncoder', message: 'raw', w: 1280, h: 720 });
      const zhTail = v.engineText({ code: 'tailStuck', frames: 100 });
      add('#14 中文给出原话且数字不丢', zh.test(zhNoEnc) && zhNoEnc.includes('1280') && zhTail.includes('100'),
        { zhNoEnc, zhTail });
    }
  }

  // ── #15 弹层安置焦点、归还焦点、背景 inert ────────────────────────────────────
  {
    // 前面几块都可能在弹层里留下状态；先把话说清楚：这一块的起点是「一个弹层都没开」。
    while (v.openModalOverlays().length) {
        v.openModalOverlays()[v.openModalOverlays().length - 1].classList.remove('show');
        await sleep(200);
    }
    const more = document.getElementById('tabMoreBtn');
    more.focus();
    const started = document.activeElement.id;
    await v.showPhoneExportModal(); await sleep(500);
    // 每次都现查：拿着「开页前抓到的引用」去读 inert 会把「元素被重建」读成「赋值没生效」。
    const live = () => ({ main: document.querySelector('.main-content'),
      side: v.dom.sidebar, bar: document.getElementById('phoneActionBar') });
    let { main, side, bar } = live();
    const inertWhileOpen = main.inert === true && side.inert === true && bar.inert === true;
    const focusInside = !!(document.querySelector('#phoneExportModal .modal-content')
        || document.querySelector('#phoneExportModal .phone-export-panel'))
      && document.querySelector('#phoneExportModal').contains(document.activeElement);
    const activeName = document.activeElement.id || document.activeElement.className;
    // 焦点必须落在「返回」这类按钮上，不能抢输入框（会弹键盘）
    const notField = !/INPUT|TEXTAREA/.test(document.activeElement.tagName);
    v.hidePhoneExportModal(); await sleep(500);
    ({ main, side, bar } = live());
    // 抽屉本来就是收起时 `syncSidebarAria` 已经把它 inert 掉了 —— 判据要对着那条规则比，
    // 不能要求「关页后一定 false」，否则旧包也能过。
    const wantSidebar = side.classList.contains('collapsed');
    const inertReleased = main.inert === false && side.inert === wantSidebar && bar.inert === false;
    const restored = document.activeElement.id || document.activeElement.tagName;
    add('#15 开页背景 inert', inertWhileOpen, { opened: v.openModalOverlays().map(o => o.id) });
    add('#15 开页焦点落进弹层', focusInside && notField, { activeName });
    add('#15 关页解除 inert', inertReleased, { main: main.inert, sidebar: side.inert, wantSidebar });
    add('#15 关页焦点归还', started === 'tabMoreBtn' && restored === 'tabMoreBtn' && focusInside,
      { started, restored, focusInside });
  }

  const failed = checks.filter(c => !c.pass);
  return JSON.stringify({ total: checks.length, pass: checks.length - failed.length,
    failed: failed.map(c => c.name), checks }, null, 1);
})()

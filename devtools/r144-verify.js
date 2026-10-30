// R144：单路/全屏时 letterbox 不许自带颜色 —— 它必须和 .player-area 是同一块黑。
// 两条纪律：① 必须先证明「事件已载入、这一格真的在画」，否则 empty 态下容器 display:none，
// 什么断言都是白捡的通过；② 断的是「容器不贡献颜色」，底色由 .player-area 那块黑负责。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });
  const bgOf = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : null; };
  const area = () => document.querySelector('.player-area');
  const box = () => document.querySelector('.video-container.is-active-single');

  // `playEvent` 收的是 eventId，喂事件对象会被第一行的 find 静默挡掉（不报错、什么都不发生）
  if (!v.currentEvent) {
    const ev = (v.eventGroups || []).find(g => (g.segments || []).length >= 2) || v.eventGroups[0];
    await v.playEvent(ev && ev.eventId);
  }
  v.multiCameraPlayer.setLayout('single');
  // 载入态是前置条件，不是假设：轮询到 .empty 消失为止
  {
    const t = Date.now();
    while (area().classList.contains('empty') && Date.now() - t < 20000) await sleep(300);
  }
  add('前置：事件已载入、这一格在画',
    !area().classList.contains('empty') && !!v.currentEvent
      && getComputedStyle(box()).display !== 'none',
    { cls: area().className, display: getComputedStyle(box()).display, event: !!v.currentEvent });

  for (const mode of ['dark', 'light']) {
    localStorage.setItem('tdashcam.themeMode', mode);
    v.applyTheme(mode === 'dark');
    await sleep(400);
    const areaBg = bgOf('.player-area');
    const boxBg = getComputedStyle(box()).backgroundColor;
    // 黑底是这一格该负责的事；容器要么全透明、要么与之同值，中间值（#111）算失败
    add(`${mode}-single-letterbox-invisible`,
      areaBg === 'rgb(0, 0, 0)' && (boxBg === 'rgba(0, 0, 0, 0)' || boxBg === areaBg),
      { playerArea: areaBg, container: boxBg });
  }

  // 反例守卫：宫格格子是卡片，#111 是它该有的样子，不许被一起改掉。
  // 格子要等布局真的换过去才存在 —— 拿不到节点是「没测到」，不是「测过」。
  localStorage.setItem('tdashcam.themeMode', 'dark'); v.applyTheme(true); await sleep(300);
  v.multiCameraPlayer.setLayout('grid');
  let cell = null;
  {
    const t = Date.now();
    while (Date.now() - t < 5000) {
      await sleep(200);
      cell = bgOf('.player-area.grid-view .video-container');
      if (cell) break;
    }
  }
  add('grid-cell-keeps-card-black', cell === 'rgb(17, 17, 17)', { cell, layout: v.multiCameraPlayer.layoutMode });

  v.multiCameraPlayer.setLayout('single');
  localStorage.setItem('tdashcam.themeMode', 'auto');
  v.applyTheme(v.resolveThemeDark('auto'));
  await sleep(300);

  const failed = checks.filter(c => !c.pass);
  return JSON.stringify({ total: checks.length, pass: checks.length - failed.length,
    failed: failed.map(c => c.name), checks }, null, 1);
})()

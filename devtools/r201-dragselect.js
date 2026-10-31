// R201 拖选回归（R203 收进仓库，并把「夹具是 8 个事件」这类写死条数的断言改成与夹具无关）。
// 跑法：node devtools/cdp-eval.mjs --file devtools/r201-dragselect.js
// 前置：/sdcard/TeslaCamMulti 有 ≥6 个自带文件夹的事件（选择态画选用得到）。
(async () => {
  const v = window.viewer;
  const out = { pass: [], fail: [] };
  const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  await v.loadTauriDirectory('/sdcard/TeslaCamMulti');
  await sleep(1000);
  v.setSelectionMode(true);
  v.toggleSidebar(true);
  await sleep(700);

  const list = document.getElementById('fileList');
  const cards = [...list.querySelectorAll('.video-card')];
  const ownable = (v.lastFilteredEvents || []).filter((e) => v.eventOwnFolder(e)).length;
  ok('列表与可见事件数对得上', cards.length > 0 && cards.length === (v.lastFilteredEvents || []).length,
    `${cards.length}/${(v.lastFilteredEvents || []).length}`);
  ok('夹具里有够画选的自带文件夹事件（≥6）', ownable >= 6, ownable);
  const rect = (i) => cards[i].getBoundingClientRect();
  const fire = (type, el, x, y) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, composed: true, pointerId: 7, pointerType: 'touch',
    isPrimary: true, clientX: x, clientY: y, buttons: 1,
  }));

  // 1) 长按 0 号卡拖到 4 号卡
  const a = rect(0), b = rect(4);
  fire('pointerdown', cards[0], a.left + 40, a.top + a.height / 2);
  await sleep(240);
  fire('pointermove', list, b.left + 40, b.top + b.height / 2);
  await sleep(60);
  const title = document.querySelector('.header-page-name')?.textContent || '';
  const pickedCount = list.querySelectorAll('.video-card.picked').length;
  const size = v.selection.size;
  ok('拖选 0→4 共选中 5 个', size === 5, size);
  ok('卡片 picked 与 selection 一致', pickedCount === size, pickedCount);
  ok('aria-selected 与 picked 同步',
    list.querySelectorAll('.video-card[aria-selected="true"]').length === size);
  ok('标题带数量', new RegExp(String(size)).test(title), title.trim());
  ok('删除键带数量', new RegExp(String(size)).test(document.getElementById('batchDeleteBtn')?.textContent || ''),
    document.getElementById('batchDeleteBtn')?.textContent);
  fire('pointerup', list, b.left + 40, b.top + b.height / 2);
  await sleep(120);
  ok('抬手后的 click 不改选择', v.selection.size === size, v.selection.size);
  ok('拖选结束清掉 drag-selecting', !list.classList.contains('drag-selecting'));

  // 2) 负向：按下立刻移动（滚动姿态）不应开始拖选
  v.toggleSelectAll();
  if (v.selection.size) v.toggleSelectAll();
  await sleep(80);
  const c = rect(2);
  fire('pointerdown', cards[2], c.left + 40, c.top + c.height / 2);
  await sleep(40);
  fire('pointermove', list, c.left + 40, c.top - 120);
  await sleep(220);
  fire('pointerup', list, c.left + 40, c.top - 120);
  await sleep(80);
  ok('按下即划走不会开始拖选', v.selection.size === 0, v.selection.size);

  // 3) 单击仍然只切一张
  const one = v.lastFilteredEvents[3];
  cards[3].click();
  await sleep(80);
  ok('单击仍然切换单个勾选', v.selection.size === 1 && v.selection.has(one.eventId), v.selection.size);
  v.setSelectionMode(false);
  return JSON.stringify(out, null, 1);
})()

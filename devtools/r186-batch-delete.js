// R186 · 批量删除的验收（A 案入口）。用 /sdcard/TeslaCamScroll（30 个 SavedClips 事件）当可删素材，
// /sdcard/TeslaCamR182（散文件「最近」）当「不可勾」素材。断言全是「用户能看见/能点到」的那一层：
// 类名、按钮文案与禁用态、弹层文案、列表条数、撤销后回位。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const $ = (id) => document.getElementById(id);
    const cards = () => [...($('fileList')?.querySelectorAll('.video-card') || [])];
    const cardOf = (id) => $(`fileList`)?.querySelector(`.video-card[data-event-id="${CSS.escape(id)}"]`);
    const tap = (card) => card.onclick({ preventDefault() {}, stopPropagation() {}, target: card });

    // ---- ① 选择态的入口与禁用态 ------------------------------------------------------------
    await v.loadTauriDirectory('/sdcard/TeslaCamScroll');
    await s(1500);
    if (v.dom.sidebar && v.dom.sidebar.getBoundingClientRect().left < -1) { v.toggleSidebar(true); await s(600); }
    ok('前置：30 个事件已就绪', (v.lastFilteredEvents || []).length === 30, `events=${(v.lastFilteredEvents || []).length}`);

    $('drawerSelectBtn').click();
    await s(500);
    ok('① 点「选择」进入选择态（抽屉挂 select-mode）', v.dom.sidebar.classList.contains('select-mode') && v.selectionMode === true,
        `mode=${v.selectionMode}`);
    ok('① 顶栏「选择」变「取消」、「完成」让位、「全选」出现',
        $('drawerSelectBtn').textContent.trim() === i18n[v.currentLanguage].selectCancel
        && getComputedStyle($('drawerDoneBtn')).display === 'none'
        && getComputedStyle($('selectAllBtn')).display !== 'none',
        `select=${$('drawerSelectBtn').textContent.trim()} done=${getComputedStyle($('drawerDoneBtn')).display} all=${getComputedStyle($('selectAllBtn')).display}`);
    ok('① 底部「选择文件夹」让位给「删除」，且 0 选时禁用',
        getComputedStyle($('selectFolderBtn')).display === 'none'
        && getComputedStyle($('batchDeleteBtn')).display !== 'none' && $('batchDeleteBtn').disabled === true,
        `folder=${getComputedStyle($('selectFolderBtn')).display} del=${getComputedStyle($('batchDeleteBtn')).display} disabled=${$('batchDeleteBtn').disabled}`);
    ok('① 每张卡都带勾选圈（选择态类）', cards().length === 30 && cards().every((c) => c.classList.contains('selectable')),
        `cards=${cards().length} selectable=${cards().filter((c) => c.classList.contains('selectable')).length}`);

    // ---- ② 点卡 = 勾选（不是播放） -------------------------------------------------------
    const evA = v.lastFilteredEvents[0].eventId;
    const evB = v.lastFilteredEvents[1].eventId;
    const before = v.currentEvent?.eventId || null;
    tap(cardOf(evA)); tap(cardOf(evB));
    await s(300);
    ok('② 点两张卡 → 选中 2 个，且没有开始播放', v.selection.size === 2 && (v.currentEvent?.eventId || null) === before,
        `选中=${v.selection.size} current=${v.currentEvent?.eventId || '-'}`);
    ok('② 被选中的卡有 picked 类、按钮文案「删除 2」且可用',
        cardOf(evA).classList.contains('picked') && cardOf(evB).classList.contains('picked')
        && $('batchDeleteBtn').disabled === false
        && $('batchDeleteBtn').textContent.includes('2'),
        `picked=${cardOf(evA).classList.contains('picked')}/${cardOf(evB).classList.contains('picked')} btn=${$('batchDeleteBtn').textContent.trim()}`);
    tap(cardOf(evA));
    await s(200);
    ok('② 再点一次取消勾选', v.selection.size === 1 && !cardOf(evA).classList.contains('picked'), `选中=${v.selection.size}`);

    // ---- ③ 全选 / 再点全清 ---------------------------------------------------------------
    $('selectAllBtn').click();
    await s(400);
    ok('③ 全选选中全部 30 个', v.selection.size === 30, `选中=${v.selection.size}`);
    $('selectAllBtn').click();
    await s(400);
    ok('③ 再点一次全清', v.selection.size === 0 && $('batchDeleteBtn').disabled === true, `选中=${v.selection.size}`);

    // ---- ④ 批量删除 → 确认框 → 列表 → 撤销 -----------------------------------------------
    const victims = v.lastFilteredEvents.slice(0, 3).map((e) => e.eventId);
    const indexes = victims.map((id) => v.eventGroups.findIndex((e) => e.eventId === id));
    victims.forEach((id) => tap(cardOf(id)));
    await s(300);
    $('batchDeleteBtn').click();
    await s(400);
    ok('④ 确认框说「删 3 个事件」并列出文件名条数',
        $('deleteConfirmTitle').textContent.includes('3')
        && ($('deleteConfirmList').children.length === 3)
        && $('deleteConfirmModal').classList.contains('show'),
        `title=${$('deleteConfirmTitle').textContent.trim()} rows=${$('deleteConfirmList').children.length}`);
    await v.confirmDeleteEvent();
    await s(600);
    ok('④ 列表少了 3 条，且自动退出选择态', v.eventGroups.length === 27 && v.selectionMode === false,
        `events=${v.eventGroups.length} mode=${v.selectionMode}`);
    ok('④ 撤销条挂出来了（一次撤销 3 个）', !!v.pendingDeleteUndo && (v.pendingDeleteUndo.items || []).length === 3,
        `items=${(v.pendingDeleteUndo?.items || []).length}`);
    const job = v.pendingDeleteUndo;
    v.undoDelete(job);
    await s(700);
    ok('④ 撤销把 3 个都放回原来的位置',
        v.eventGroups.length === 30 && victims.every((id, i) => v.eventGroups[indexes[i]]?.eventId === id),
        `events=${v.eventGroups.length} 回位=${victims.map((id, i) => v.eventGroups[indexes[i]]?.eventId === id).join('/')}`);

    // ---- ⑤ 「最近」那条不可勾（同一条删除规则） ------------------------------------------
    await v.loadTauriDirectory('/sdcard/TeslaCamR182');
    await s(1200);
    v.setSelectionMode(true);
    await s(500);
    const locked = cards().filter((c) => c.classList.contains('locked'));
    ok('⑤ 散文件「最近」在选择态里是 locked', locked.length >= 1, `locked=${locked.length}/${cards().length}`);
    const lockedId = locked[0]?.dataset.eventId;
    tap(locked[0]);
    await s(300);
    ok('⑤ 点它不会进选中集合', v.selection.size === 0 && !!lockedId, `选中=${v.selection.size}`);
    v.setSelectionMode(false);
    await s(300);

    // ---- ⑥ 单删那条链没被改坏 -------------------------------------------------------------
    await v.loadTauriDirectory('/sdcard/TeslaCamScroll');
    await s(1500);
    const one = v.lastFilteredEvents[5];
    v.openDeleteConfirm(one);
    await s(300);
    await v.confirmDeleteEvent();
    await s(600);
    const goneCount = v.eventGroups.length;
    v.undoDelete(v.pendingDeleteUndo);
    await s(700);
    ok('⑥ 单事件删除/撤销仍然成对', goneCount === 29 && v.eventGroups.length === 30,
        `删后=${goneCount} 撤销后=${v.eventGroups.length}`);
    out.orient = `${innerWidth}x${innerHeight}`;
    return out;
})()

// R185 · 两条验收：① 选中目录的那一刻「最近目录」chip 就该在（不等 285s 的 walk）；
// ② 删掉视口里的一个事件后，列表留在原处、手指下的那张卡不动。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));

    // ① chip 在选中时就有：调 loadTauriDirectory 之后**不等它 resolve**，立刻读 chip 列表
    const probePath = '/sdcard/TeslaCamScroll';
    const before = v.readRecentDirs();
    const p = v.loadTauriDirectory(probePath, {});
    await s(60);
    const during = v.readRecentDirs();
    ok('① 选中目录后、扫描完成前，「最近目录」里已经有它（R185）',
        during[0] === probePath && (before[0] !== probePath || before.includes(probePath)),
        `选中后 60ms 的 chip[0]=${during[0] || '-'}｜选中前=${before.slice(0, 2).join('|') || '-'}`);
    const chipEl = [...document.querySelectorAll('#recentDirs .recent-chip')]
        .find((n) => n.dataset.path === probePath);
    ok('① 抽屉里那枚 chip 此刻也画出来了（不是只写了 localStorage）', !!chipEl,
        chipEl ? `text=${(chipEl.textContent || '').trim().slice(0, 12)}` : '没有这枚 chip');
    await p;
    await s(1500);

    // ② 列表滚动位置：先找一张能删的卡，滚到中间，再走产品自己的删除路径
    const del = (v.eventGroups || []).find((e) => v.eventDeleteTargets(e));
    if (!del) { out.fail.push('② 前置：这一盘没有可删除的事件'); return out; }
    if (v.dom.sidebar && v.dom.sidebar.getBoundingClientRect().left < -1) { v.toggleSidebar(true); await s(600); }
    const el = v.videoListComponent?.container || v.dom.fileList;
    // 先把所有页铺开，再滚到一段确定的位置
    let guard = 0;
    while (v.videoListComponent.listEvents && v.videoListComponent.listShown < v.videoListComponent.listEvents.length && guard++ < 50) {
        v.videoListComponent.appendListPage(400);
    }
    el.scrollTop = Math.round(el.scrollHeight * 0.45);
    await s(500);
    const box = el.getBoundingClientRect();
    const rows = [...el.querySelectorAll('[data-event-id]')];
    const firstVisible = rows.find((r) => r.getBoundingClientRect().bottom > box.top + 1);
    const beforeTop = el.scrollTop;
    const beforeOffset = firstVisible ? Math.round(firstVisible.getBoundingClientRect().top - box.top) : NaN;
    // 删「锚行下面第 3 张」——删锚本身测的是回落那条路，测不到「手指下的卡不动」。
    const idx = Math.max(0, rows.indexOf(firstVisible));
    const victimCard = rows.slice(idx + 1).find((r) => {
        const ev = (v.eventGroups || []).find((e) => e.eventId === r.dataset.eventId);
        return ev && v.eventDeleteTargets(ev);
    });
    const victim = victimCard ? (v.eventGroups || []).find((e) => e.eventId === victimCard.dataset.eventId) : del;
    v.openDeleteConfirm(victim);
    await s(300);
    await v.confirmDeleteEvent();
    await s(600);
    const afterBox = el.getBoundingClientRect();
    const anchorId = firstVisible && firstVisible.dataset.eventId !== victim.eventId ? firstVisible.dataset.eventId : null;
    const anchorRow = anchorId ? el.querySelector(`[data-event-id="${CSS.escape(anchorId)}"]`) : null;
    const afterOffset = anchorRow ? Math.round(anchorRow.getBoundingClientRect().top - afterBox.top) : NaN;
    out.detail = { beforeTop, afterTop: Math.round(el.scrollTop), beforeOffset, afterOffset, anchorId, victim: victim.eventId };
    ok('② 删掉视口里的一个事件后，列表没有跳回开头（R185）',
        el.scrollTop > beforeTop * 0.5, `删前=${beforeTop} 删后=${Math.round(el.scrollTop)}`);
    ok('② 手指下的那张卡没有位移（锚行偏移不变）',
        anchorId ? Math.abs(afterOffset - beforeOffset) <= 2 : false,
        anchorId ? `锚=${anchorId} 删前偏移=${beforeOffset} 删后=${afterOffset}` : '锚行是被删的那张（改用 scrollTop 回落）');
    // 撤销同样要留在原处（否则「删了又撤销」会顺带把人送到列表开头）
    const job = v.pendingDeleteUndo;
    if (job) {
        const beforeUndo = el.scrollTop;
        v.undoDelete(job);
        await s(600);
        const box2 = el.getBoundingClientRect();
        const row2 = anchorId ? el.querySelector(`[data-event-id="${CSS.escape(anchorId)}"]`) : null;
        const off2 = row2 ? Math.round(row2.getBoundingClientRect().top - box2.top) : NaN;
        ok('③ 撤销之后同样不跳回开头', el.scrollTop > beforeUndo * 0.5 && (anchorId ? Math.abs(off2 - beforeOffset) <= 2 : true),
            `撤销前=${Math.round(beforeUndo)} 撤销后=${Math.round(el.scrollTop)} 锚偏移=${off2}`);
        out.detail.undoTop = Math.round(el.scrollTop);
    }
    return out;
})()

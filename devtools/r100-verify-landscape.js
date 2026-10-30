// R100-1 acceptance, landscape. The complaint was 「手势说明 的图标没和上面几行对齐」, and the cause was
// geometric: the panel is a seven-column grid, rows one and two hold six items each, so column 7 is
// empty above — and the language row's two-cell span pushed 手势说明 into that empty column. Swapping
// them should put 手势说明 in column 5 (with 下载视频 / 触发标注 above it) and the wide language row in
// 6–7. Assert the shared left edges, then re-assert the R99 invariants the swap could have disturbed.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const panel = document.getElementById('headerActionsGroup');
    const dom = id => document.getElementById(id);
    const L = id => Math.round(dom(id).getBoundingClientRect().left);
    const R = id => Math.round(dom(id).getBoundingClientRect().right);
    const same = (a, b) => Math.abs(a - b) <= 1;

    for (let i = 0; i < 30 && +getComputedStyle(panel).opacity !== 1; i++) {
        if (i % 8 === 0) dom('tabMoreBtn').click();
        await sleep(250);
    }
    ok('panel is open sideways', +getComputedStyle(panel).opacity === 1, getComputedStyle(panel).opacity);

    // Column 5: the two rows above set the reference, the swapped row has to join it.
    ok('E 手势说明 与 下载视频 / 触发标注 同列',
        same(L('gestureHelpBtn'), L('downloadFileBtn')) && same(L('gestureHelpBtn'), L('triggerHlBtn')),
        `gesture=${L('gestureHelpBtn')} download=${L('downloadFileBtn')} trigger=${L('triggerHlBtn')}`);
    // Column 6: the wide language row starts where the six-item rows end.
    ok('E 语言行 与 抓帧 / A-B 循环 同列起',
        same(L('langToggleBtn'), L('snapshotBtn')) && same(L('langToggleBtn'), L('loopABBtn')),
        `lang=${L('langToggleBtn')} snapshot=${L('snapshotBtn')} loopAB=${L('loopABBtn')}`);
    const pr = panel.getBoundingClientRect();
    ok('E 语言行铺到面板右边缘（span 2 生效）',
        Math.abs(R('langToggleBtn') - (pr.right - parseFloat(getComputedStyle(panel).paddingRight))) <= 2,
        `langRight=${R('langToggleBtn')} panelRight=${Math.round(pr.right)}`);
    ok('E 手势说明 不是某一行的独苗',
        [...panel.querySelectorAll('button[id]')].filter(b => b.id !== 'gestureHelpBtn'
            && same(L(b.id), L('gestureHelpBtn'))).length >= 2,
        [...panel.querySelectorAll('button[id]')].filter(b => same(L(b.id), L('gestureHelpBtn'))).map(b => b.id).join(','));

    // The R99 invariants, re-checked: the swap moved a two-cell row, which is exactly what could
    // re-open a hole at the end of a line.
    ok('E 面板仍然不用滚动', panel.scrollHeight <= panel.clientHeight + 1,
        `content=${panel.scrollHeight} client=${panel.clientHeight}`);
    const cut = [...panel.querySelectorAll('.btn-text, .choice-label')].filter(n => n.textContent.trim())
        .map(n => { const rg = document.createRange(); rg.selectNodeContents(n);
            return { t: (n.textContent || '').trim().slice(0, 10), need: rg.getBoundingClientRect().width, got: n.getBoundingClientRect().width }; })
        .filter(r => r.need > r.got + 0.3);
    ok('E 没有标签被省略号吃掉', cut.length === 0, cut.map(r => `${r.t} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`).join(' | '));
    const live = [...panel.querySelectorAll('button, a')].filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
    const dead = live.filter(n => { const b = n.getBoundingClientRect(); const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !(hit === n || n.contains(hit)); });
    ok(`E ${live.length} 行仍可点`, dead.length === 0, dead.map(n => n.id).join(','));
    const clipped = [...panel.children].filter(n => { const b = n.getBoundingClientRect();
        return b.height > 4 && (b.bottom > pr.bottom + 1 || b.top < pr.top - 1); });
    ok('E 没有半行被面板切掉', clipped.length === 0, clipped.map(n => n.id || n.className.split(' ')[0]).join(','));
    out.orient = `${innerWidth}x${innerHeight}`;
    return out;
})()

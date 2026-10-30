// R164 · landscape drawer with a second source (USB + internal). The report: the list got
// cramped and content overlapped. Root cause: every fixed row was flex-shrunk; `.recent-dirs`
// is a scroll container and therefore allowed to collapse to 0, so its 40px chips were clipped
// into a ~15px band and painted over the first card. The filter stack now floats beside the
// drawer in landscape, so this file asserts the list keeps the room and nothing overlaps.
(async () => {
    for (let i = 0; i < 30 && innerWidth <= innerHeight; i += 1) await new Promise((r) => setTimeout(r, 400));
    if (innerWidth <= innerHeight) throw new Error('rotation did not land: ' + innerWidth + 'x' + innerHeight);

    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const num = (x) => +Number(x).toFixed(1);
    const box = (el) => { const r = el.getBoundingClientRect(); return { t: num(r.top), b: num(r.bottom), l: num(r.left), r: num(r.right), w: num(r.width), h: num(r.height) }; };
    const cs = (el) => getComputedStyle(el);
    const sidebar = document.querySelector('.sidebar');
    const header = document.querySelector('.sidebar-header');
    const search = document.querySelector('.event-search-row');
    const stack = document.querySelector('.filter-stack');
    const filters = document.querySelector('.filters');
    const quick = document.getElementById('quickFilters');
    const dirs = document.getElementById('recentDirs');
    const list = document.getElementById('fileList');
    const footer = document.querySelector('.sidebar-footer');
    const funnel = document.querySelector('.sidebar-header .filter-toggle-btn');
    // The drawer transition is 300ms of CSS, but this emulator can start it a frame late under
    // load; measure "settled", never a fixed sleep.
    const settleSidebar = async (open) => {
        for (let i = 0; i < 40; i += 1) {
            const r = sidebar.getBoundingClientRect();
            if (open ? Math.abs(r.left) <= 0.5 : r.right <= 0.5) return true;
            await sleep(100);
        }
        return false;
    };

    if (!stack) throw new Error('filter-stack wrapper missing');
    ok('基准：筛选组已包进 filter-stack', !!stack);

    if (sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    const sidebarOpen = await settleSidebar(true);
    ok('基准：抽屉打开', !sidebar.classList.contains('collapsed') && sidebarOpen, num(box(sidebar).l));
    // Known starting point: the stored preference may already have the panel open.
    sidebar.classList.remove('filters-open');
    funnel.classList.remove('is-on');
    funnel.setAttribute('aria-expanded', 'false');
    await sleep(150);
    ok('基准：筛选面板从关闭起步', cs(filters).display === 'none', cs(filters).display);
    funnel.click();
    await sleep(400);
    ok('基准：筛选面板打开', sidebar.classList.contains('filters-open'));

    // The panel only becomes absolute after the class lands; wait for the computed state rather
    // than trusting the click.
    for (let i = 0; i < 20 && cs(stack).position !== 'absolute'; i += 1) await sleep(100);
    await sleep(250);

    const S = box(sidebar), H = box(header), R = box(search), P = box(stack), L = box(list), F = box(footer);
    const display = cs(stack).display;
    const pos = cs(stack).position;
    const chipBoxes = Array.from(dirs.querySelectorAll('.recent-chip')).map((c) => box(c));
    const chips = chipBoxes.length;

    ok('筛选面板脱离纵向流（absolute）', display === 'flex' && pos === 'absolute', `${display}/${pos}`);
    ok('面板在抽屉右侧留 8px 缝', P.l >= S.r + 7 && P.l <= S.r + 9, `panel.left=${P.l} drawer.right=${S.r}`);
    ok('面板不越出屏幕右边', P.r <= innerWidth, `panel.right=${P.r} vw=${innerWidth}`);
    ok('面板宽度可用（>=300）', P.w >= 300, P.w);
    ok('面板有实体底（不透明）', (() => { const m = cs(stack).backgroundColor.match(/[\d.]+/g) || []; return m.length < 4 || +m[3] === 1; })(), cs(stack).backgroundColor);
    ok('导航行没有被压扁（>=70）', H.h >= 70, H.h);
    ok('搜索行保持 40+', R.h >= 44, R.h);
    ok('列表拿到抽屉全部余高（>=120）', L.h >= 120, L.h);
    ok('列表紧接搜索行（筛选不再挤它）', Math.abs(L.t - R.b) <= 1, `list.top=${L.t} search.bottom=${R.b}`);
    ok('列表与页脚不重叠', L.b <= F.t + 1, `list.bottom=${L.b} footer.top=${F.t}`);
    ok('导航、搜索、列表首尾相接', H.b <= R.t + 1, `header.bottom=${H.b} search.top=${R.t}`);
    ok('最近目录行有 2+ 个目录', chips >= 2, chips);
    ok('最近目录行恢复 40 高', box(dirs).h >= 40, box(dirs).h);
    ok('最近目录 chip 没有被裁切', chipBoxes.every((c) => c.t >= P.t - 0.5 && c.b <= P.b + 0.5), chipBoxes.map((c) => `${c.t}-${c.b}`).join(' '));
    ok('最近目录 chip 全高（>=40）', chipBoxes.every((c) => c.h >= 40), chipBoxes.map((c) => c.h).join(','));
    ok('面板内四个字段仍是 40 档', box(document.getElementById('dateFilter')).h >= 40
        && box(document.querySelector('.type-segments')).h >= 36
        && box(document.querySelector('.date-chip')).h >= 40, [
        box(document.getElementById('dateFilter')).h,
        box(document.querySelector('.type-segments')).h,
        box(document.querySelector('.date-chip')).h,
    ].join('/'));
    ok('首张卡片完整落在列表里', (() => {
        const c = list.querySelector('.video-card');
        if (!c) return false;
        const b = box(c);
        return b.t >= L.t - 0.5 && b.b <= L.b + 0.5;
    })(), (() => { const c = list.querySelector('.video-card'); return c ? box(c) : null; })());

    // Hit-testing is the half a DOM measurement cannot answer: the panel hangs outside the
    // sidebar's box, where the scrim lives at z-index 1600. If the sidebar stack lost, taps
    // would land on the scrim and close the drawer instead of hitting the chip.
    const chip = dirs.querySelector('.recent-chip');
    if (chip) {
        const b = box(chip);
        const hit = document.elementFromPoint((b.l + b.r) / 2, (b.t + b.b) / 2);
        ok('面板外层命中测试不是遮罩', !!hit && (hit === chip || chip.contains(hit)), hit ? `${hit.tagName}.${hit.className}` : 'null');
    }
    const dateChip = document.querySelector('.date-chip');
    if (dateChip) {
        const b = box(dateChip);
        const hit = document.elementFromPoint((b.l + b.r) / 2, (b.t + b.b) / 2);
        ok('日期 chip 命中测试在面板内', !!hit && (hit === dateChip || dateChip.contains(hit)), hit ? `${hit.tagName}.${hit.className}` : 'null');
    }

    // Closing filters gives the stack back to the flow and the list back its first pixel; this
    // is the state the drawer spends most of its life in.
    funnel.click();
    await sleep(400);
    ok('收起筛选：面板回到 display:contents', cs(stack).display === 'contents', cs(stack).display);
    ok('收起筛选：筛选区隐藏', cs(filters).display === 'none', cs(filters).display);
    const L2 = box(list);
    ok('收起筛选：列表从搜索行下方开始', Math.abs(L2.t - R.b) <= 1, `list.top=${L2.t} search.bottom=${R.b}`);
    ok('收起筛选：列表不变矮', L2.h >= L.h - 1, `open=${L.h} closed=${L2.h}`);

    // Reopen, then close the drawer: the panel must not stay painted over the player while the
    // drawer is translated off-screen.
    funnel.click();
    await sleep(400);
    v.toggleSidebar(false);
    const sidebarClosed = await settleSidebar(false);
    ok('关闭抽屉：面板不再 absolute', cs(stack).position !== 'absolute', `${cs(stack).display}/${cs(stack).position}`);
    ok('关闭抽屉：筛选区随抽屉移出屏幕', sidebarClosed && box(filters).r <= 1, `sidebarClosed=${sidebarClosed} filters.right=${box(filters).r}`);

    v.toggleSidebar(false);
    try { localStorage.setItem('tdashcam.filtersOpen', '0'); } catch (e) { /* private mode */ }
    sidebar.classList.remove('filters-open');
    funnel.classList.remove('is-on');
    funnel.setAttribute('aria-expanded', 'false');
    await sleep(400);

    return JSON.stringify(out);
})()

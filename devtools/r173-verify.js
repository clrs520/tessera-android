// R173 · B6/B8/C9/C10 — criteria for this round's sheet and cache changes.
// Run in the landscape phone layout with the drawer and the filter sheet open:
//   node devtools/cdp-eval.mjs --file devtools/r173-verify.js
// Every check reads computed style or a rendered rect, not a JS flag — a suite that only reads
// `viewer.*` would stay green through a whole sheet of CSS that never applied (R42).
(async () => {
    const v = window.viewer;
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const cs = (el) => getComputedStyle(el);
    const rect = (el) => el.getBoundingClientRect();
    const transparent = (bg) => bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';

    if (!v) return JSON.stringify({ pass: 0, fail: 1, checks: [{ name: 'viewer', ok: false, detail: 'none' }] });
    check('横屏手机档', window.innerWidth > window.innerHeight
        && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches,
        `${window.innerWidth}x${window.innerHeight}`);
    if (!v.eventGroups.length) {
        await v.loadTauriDirectory(v.lastScannedPath || localStorage.getItem('tdashcam.mediaDir'));
        await wait(400);
    }
    check('事件已载入', v.eventGroups.length > 0, `${v.eventGroups.length}`);
    // Precondition the sheet has to be paid for before anything measured inside it means anything:
    // a closed drawer gives `.filter-stack` zero width, and every rect below would read 0 while the
    // product is fine (R143: 判据不自己造前置条件会白捡通过 / 白捡失败).
    if (v.dom.sidebar.classList.contains('collapsed')) v.toggleSidebar(true);
    await wait(320);
    v.setFiltersOpen(true, false);
    await wait(360);
    const stackW = Math.round(v.dom.filterStack.getBoundingClientRect().width);
    check('前置成立：抽屉开着、筛选面展开（面宽 340±1）',
        !v.dom.sidebar.classList.contains('collapsed') && stackW >= 340 && stackW <= 342,
        `stack=${stackW} collapsed=${v.dom.sidebar.classList.contains('collapsed')}`);

    // ── B8 · 显示 chips ─────────────────────────────────────────────────────────────
    const chips = ['#sheetStarBtn', '#sheetTriggerBtn', '#sheetSortBtn'].map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const r = rect(el);
        return { sel, text: el.textContent, pressed: el.getAttribute('aria-pressed'),
            on: el.classList.contains('on'), w: r.width, h: r.height,
            border: cs(el).borderTopWidth, bg: cs(el).backgroundColor, font: cs(el).fontSize,
            radius: cs(el).borderTopLeftRadius };
    });
    check('三条 chip 都在筛选面里并且看得见', chips.every(c => !c.missing && c.w > 20 && c.h > 0),
        chips.map(c => `${c.sel.slice(1)}=${Math.round(c.w)}x${Math.round(c.h)}「${c.text}」`).join(' | '));
    check('chip 高 ≥40（触摸下限）', chips.every(c => c.h >= 40),
        chips.map(c => Math.round(c.h)).join('/'));
    check('chip 摘掉了浏览器按钮框', chips.every(c => c.border === '0px' && transparent(c.bg)),
        chips.map(c => `border=${c.border} bg=${c.bg}`).join(' | '));
    check('chip 字号在同一档', new Set(chips.map(c => c.font)).size === 1, chips[0]?.font);
    check('圆角和事件类型直选同款（胶囊）', new Set(chips.map(c => c.radius)).size === 1, chips[0]?.radius);
    check('收藏 / 触发带 aria-pressed，排序不带（循环态写在文案里）',
        chips[0]?.pressed !== null && chips[1]?.pressed !== null && chips[2]?.pressed === null,
        `${chips[0]?.pressed} / ${chips[1]?.pressed} / ${chips[2]?.pressed}`);
    // `inert` belongs to the folded sheet, not the open one: measured while open it is legitimately
    // absent, so the fold has to be driven before the question is asked.
    const chipRow = document.querySelector('.filter-view-row');
    v.setFiltersOpen(false, false);
    await wait(300);
    const foldedInert = !!chipRow.closest('.filter-stack')?.inert;
    v.setFiltersOpen(true, false);
    await wait(300);
    const openInert = !!chipRow.closest('.filter-stack')?.inert;
    check('折叠时 chip 行随抽屉退出 tab ring（inert），展开时回到环里',
        foldedInert === true && openInert === false, `folded=${foldedInert} open=${openInert}`);
    // and the ⋮ menu must say the same thing at the same moment
    const menuStar = document.querySelector('#starFilterBtn');
    const accentSolid = cs(document.querySelector('#sheetStarBtn')).getPropertyValue('--accent-solid').trim();
    v.starredOnly = !v.starredOnly;
    v.updateStarFilterLabel();
    // R174 gave the chip a 160ms colour transition: reading the background 60ms in returns the
    // interpolated start, not the state (R143: 刚设完就读 getComputedStyle 会读到插值).
    await wait(240);
    const afterFlip = {
        chipOn: document.querySelector('#sheetStarBtn').classList.contains('on'),
        chipPressed: document.querySelector('#sheetStarBtn').getAttribute('aria-pressed'),
        chipBg: cs(document.querySelector('#sheetStarBtn')).backgroundColor,
        menuOn: !!menuStar && menuStar.classList.contains('is-on'),
        menuPressed: menuStar ? menuStar.getAttribute('aria-pressed') : null,
    };
    check('⋮ 菜单一行动作，chip 立刻同色同态（双向同步）',
        afterFlip.chipOn === true && afterFlip.menuOn === true
        && afterFlip.chipPressed === 'true' && afterFlip.menuPressed === 'true'
        && !transparent(afterFlip.chipBg),
        JSON.stringify(afterFlip) + (accentSolid ? ` accent=${accentSolid}` : ''));
    v.starredOnly = !v.starredOnly;
    v.updateStarFilterLabel();
    await wait(240);
    check('再点 ⋮ 那一下，chip 也一起退回未选',
        document.querySelector('#sheetStarBtn').classList.contains('on') === false
        && (menuStar ? menuStar.classList.contains('is-on') === true : true) === false,
        `chip=${document.querySelector('#sheetStarBtn').classList.contains('on')} menu=${menuStar?.classList.contains('is-on')}`);

    // ── B8 · 柱状图成为真筛选 ───────────────────────────────────────────────────────
    const wrap = document.getElementById('filterDayChart');
    const bars = [...wrap.querySelectorAll('.filter-day-bar')];
    check('柱是 <button type=button> 且带 data-date',
        bars.length > 0 && bars.every(b => b.tagName === 'BUTTON' && b.type === 'button' && b.dataset.date),
        `n=${bars.length} ${bars.map(b => b.dataset.date).slice(0, 3).join(',')}`);
    check('容器不再 aria-hidden（读者现在是真的）', wrap.getAttribute('aria-hidden') === null,
        String(wrap.getAttribute('aria-hidden')));
    check('每根柱有 aria-pressed', bars.every(b => b.hasAttribute('aria-pressed')),
        bars.map(b => b.getAttribute('aria-pressed')).join(','));
    check('柱不顶浏览器按钮框', bars.every(b => cs(b).borderTopWidth === '0px'
        && transparent(cs(b).backgroundColor)), `border=${cs(bars[0]).borderTopWidth} bg=${cs(bars[0]).backgroundColor}`);
    check('柱高 ≥40（可点）', bars.every(b => rect(b).height >= 40), Math.round(rect(bars[0]).height));
    const pick = bars[bars.length - 1];
    const beforePick = { date: v.dom.dateFilter.value, shown: v.lastFilteredEvents.length, all: v.eventGroups.length };
    pick.click();
    await wait(420);
    const dayEvents = v.eventGroups.filter(e => (e.startTime || '').slice(0, 10) === pick.dataset.date).length;
    check('点柱 = 只看那一天（输入框、列表、高亮三处一致）',
        v.dom.dateFilter.value === pick.dataset.date
        && v.lastFilteredEvents.length === dayEvents
        && document.querySelector('#filterDayChart .filter-day-bar.is-on')?.dataset.date === pick.dataset.date,
        `date=${v.dom.dateFilter.value} shown=${v.lastFilteredEvents.length}/${dayEvents}（原 ${beforePick.shown}/${beforePick.all}）`);
    check('选中的柱 aria-pressed=true，其余 false',
        [...wrap.querySelectorAll('.filter-day-bar')]
            .every(b => b.getAttribute('aria-pressed') === String(b.dataset.date === pick.dataset.date)),
        [...wrap.querySelectorAll('.filter-day-bar')].map(b => b.getAttribute('aria-pressed')).join(','));
    // flatpickr must agree with the bar, or reopening the calendar shows the wrong day
    check('日历自己的选中态跟着柱走（不是只改了输入框）',
        (v.flatpickrInstance?.selectedDates || []).length === 1
        && `${v.flatpickrInstance.selectedDates[0].getFullYear()}-${String(v.flatpickrInstance.selectedDates[0].getMonth() + 1).padStart(2, '0')}-${String(v.flatpickrInstance.selectedDates[0].getDate()).padStart(2, '0')}` === pick.dataset.date,
        JSON.stringify(v.flatpickrInstance?.selectedDates?.map(d => d.toString().slice(0, 15)) || []));
    wrap.querySelector('.filter-day-bar.is-on').click();
    await wait(420);
    check('再点同一根柱清掉日期', v.dom.dateFilter.value === ''
        && v.lastFilteredEvents.length === beforePick.all,
        `date=${v.dom.dateFilter.value} shown=${v.lastFilteredEvents.length}`);

    // ── C9 · 来源折起来 ─────────────────────────────────────────────────────────────
    const dirsWrap = document.getElementById('recentDirs');
    const more = document.getElementById('sourceMoreBtn');
    const allChips = [...dirsWrap.querySelectorAll('.recent-chip')];
    const visibleChips = () => [...dirsWrap.querySelectorAll('.recent-chip')].filter(c => rect(c).height > 0);
    check('只有一份来源时不发「更多」行',
        allChips.length < 2 ? more.hidden === true : more.hidden === false,
        `total=${allChips.length} hidden=${more.hidden}`);
    if (allChips.length >= 2) {
        const foldedState = dirsWrap.classList.contains('is-folded');
        check('默认折叠：只留当前来源一行',
            foldedState ? visibleChips().length === 1 : allChips.length === visibleChips().length,
            `folded=${foldedState} visible=${visibleChips().length}/${allChips.length}`);
        check('「更多来源」把还剩几份写在文案里', /\(\d+\)/.test(more.textContent), more.textContent);
        check('更多行 ≥40 高并占满面宽',
            rect(more).height >= 40 && rect(more).width >= rect(dirsWrap).width - 1,
            `${Math.round(rect(more).width)}x${Math.round(rect(more).height)}`);
        check('更多行文案不溢出（340 的面装得下）',
            more.scrollWidth <= more.clientWidth + 1, `text=${more.scrollWidth}/${more.clientWidth}`);
        const body = document.querySelector('.filter-sheet-body');
        const overflowFolded = body.scrollHeight - body.clientHeight;
        more.click();
        await wait(320);
        check('点「更多来源」把其余来源交回来',
            dirsWrap.classList.contains('is-folded') === false
            && visibleChips().length === allChips.length && more.getAttribute('aria-expanded') === 'true',
            `visible=${visibleChips().length}/${allChips.length}`);
        check('展开后文案换成「收起」', /收起|Fewer/i.test(more.textContent), more.textContent);
        const overflowOpen = body.scrollHeight - body.clientHeight;
        check('展开确实把面撑高了', overflowOpen >= overflowFolded,
            `溢出 ${overflowFolded} → ${overflowOpen}px（面高 ${body.clientHeight}）`);
        more.click();
        await wait(320);
        check('再点收回一行，溢出回到折叠值',
            dirsWrap.classList.contains('is-folded') === true
            && visibleChips().length === 1 && (body.scrollHeight - body.clientHeight) === overflowFolded,
            `溢出 ${body.scrollHeight - body.clientHeight}px`);
    }

    // ── C10 · 日历最后一行不再贴板底 ───────────────────────────────────────────────
    v.flatpickrInstance?.open?.();
    await wait(360);
    const cal = document.querySelector('.flatpickr-calendar.teslacam-flatpickr.open');
    if (cal) {
        const days = [...cal.querySelectorAll('.flatpickr-day')];
        const calRect = rect(cal);
        const lastBottom = Math.max(...days.map(d => rect(d).bottom));
        check('日历最后一段日期与面板底边之间留出 ≥6px',
            parseFloat(cs(cal).paddingBottom) >= 6 && calRect.bottom - lastBottom >= 6,
            `pad=${cs(cal).paddingBottom} gap=${Math.round(calRect.bottom - lastBottom)}px`);
        check('日历仍整块在屏内（R171b 的账不许回归）',
            calRect.top >= -0.5 && calRect.bottom <= window.innerHeight + 0.5,
            `${Math.round(calRect.top)}…${Math.round(calRect.bottom)} / 屏高 ${window.innerHeight}`);
    } else {
        check('日历打得开（C10 的前置）', false, 'no open calendar');
    }
    v.flatpickrInstance?.close?.();

    // ── B6 · 侧车缓存跨启动 ─────────────────────────────────────────────────────────
    const KEY = 'tdashcam.sidecarCache.v1';
    const root = '/r173-probe/TeslaCam';
    const files = [
        { path: `${root}/SavedClips/2026-10-24_13-12-45-front/event.json`, size: 321 },
        { path: `${root}/SavedClips/2026-10-24_13-13-45-front/event.json`, size: 0 },
    ];
    const seedCache = () => {
        v.sidecarCacheRoot = root;
        v.sidecarCache = new Map();
        v.sidecarCache.set(files[0].path, { ok: true, city: '苏州市', street: '工业大道',
            timestamp: 1761283965, lat: 31.2, lon: 120.6, reason: 'alert_speed_limit' });
        v.sidecarCache.set(files[1].path, { ok: true, city: '苏州市', street: '星湖街',
            timestamp: '2026-10-24 13:13:45', lat: null, lon: null, reason: null });
        // a sidecar the stick could not answer for must not become a permanent note saying so
        v.sidecarCache.set(files[0].path.replace('event.json', 'gone.json'), { ok: false });
    };
    localStorage.removeItem(KEY);
    seedCache();
    v.persistSidecarCache(root, files);
    await wait(200);
    const raw = localStorage.getItem(KEY);
    let stored = null;
    try { stored = JSON.parse(raw || 'null'); } catch (e) { stored = 'unparseable'; }
    check('写下的行按 root 归档，失败的那条不进存储',
        !!stored && stored.root === root && Array.isArray(stored.rows) && stored.rows.length === 2,
        raw ? `${raw.length}B rows=${stored?.rows?.length}` : 'nothing written');
    check('每行带上侧车的字节数（下次启动的校验凭据）',
        stored && stored.rows[0][1] === 321, stored ? `size=${stored.rows[0][1]}` : '-');
    const hydrateInto = (which) => {
        v.sidecarCache = new Map();
        const n = v.hydrateSidecarCache(which);
        return { n, row: v.sidecarCache.get(files[0].path) || {}, strRow: v.sidecarCache.get(files[1].path) || {} };
    };
    const first = hydrateInto(root);
    check('重开同一目录：两条原样回来（城市 / 时间戳 / 经纬度都不丢）',
        first.n === 2 && first.row.city === '苏州市' && first.row.street === '工业大道'
        && first.row.timestamp === 1761283965 && first.row.lat === 31.2 && first.row.sz === 321,
        `hydrated=${first.n} ${JSON.stringify(first.row)}`);
    check('时间戳写成字符串的固件也原样回来（不折算成数字）',
        first.strRow.timestamp === '2026-10-24 13:13:45' && first.strRow.lat === null,
        JSON.stringify(first.strRow));
    // the size guard has to be exercised through the real hit test, not by reading the map
    const fake = { ...files[0], eventId: 'e1', webkitRelativePath: 'TeslaCam/SavedClips/x/event.json' };
    const grown = { ...fake, size: 400 };
    const remembered = v.sidecarCache.get(grown.path);
    if (remembered && remembered.sz && remembered.sz !== sidecarSizeOf(grown)) v.sidecarCache.delete(grown.path);
    check('字节数一变就作废（宁可重读，不拿旧地址糊弄）',
        remembered?.sz === 321 && v.sidecarCache.has(grown.path) === false,
        `sz=${remembered?.sz} → 400, kept=${v.sidecarCache.has(grown.path)}`);
    // a remembered row has to land in the event exactly like a fresh read
    const fresh = hydrateInto(root);
    const evt = { eventId: 'e1' };
    const hit = fresh.row;
    evt.city = hit.city; evt.street = hit.street; evt.eventTimestamp = hit.timestamp;
    evt.lat = hit.lat; evt.lon = hit.lon;
    if (typeof hit.reason === 'string') evt.reason = hit.reason;
    check('还原出来的事件字段和真读一次一样（reason 仍按字符串判定）',
        evt.city === '苏州市' && evt.eventTimestamp === 1761283965 && evt.reason === 'alert_speed_limit',
        JSON.stringify(evt));
    const other = hydrateInto('/r173-other/TeslaCam');
    check('换一个目录不捡别人的答案，并把旧存储清掉',
        other.n === 0 && v.sidecarCache.size === 0 && localStorage.getItem(KEY) === null,
        `hydrated=${other.n} size=${v.sidecarCache.size} left=${localStorage.getItem(KEY)}`);
    // a store that never matches the root must not be repopulated by a different folder
    seedCache();
    v.persistSidecarCache(root, files);
    await wait(200);
    const again = localStorage.getItem(KEY);
    check('再写一遍读一遍结果一致（缓存可自持）',
        !!again && JSON.parse(again).rows.length === 2 && hydrateInto(root).n === 2,
        again ? `${again.length}B` : 'nothing written');
    localStorage.removeItem(KEY);
    v.sidecarCache = new Map();
    v.sidecarCacheRoot = v.lastScannedPath;
    v.sidecarHydrated = 0;
    v.sidecarPersisted = 0;

    v.setFiltersOpen(false, false);
    v.filterAndRender();
    await wait(200);
    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks }, null, 1);
})()

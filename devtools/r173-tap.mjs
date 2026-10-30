// R173 · real fingers on the sheet's new controls.
//   显示 chips (收藏 / 触发 / 排序) do the same thing the ⋮ rows do and stay in sync with them,
//   a day bar filters the list to that day and clears again, and 来源 folds / unfolds.
// Run: node devtools/r173-tap.mjs      (needs the app installed and the emulator running)
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const SERIAL = process.env.ADB_SERIAL || 'emulator-5554';
const run = (args) => execFileSync(ADB, ['-s', SERIAL, ...args], { encoding: 'utf8' });
const evalFile = (file) => {
    const raw = execFileSync('node', ['devtools/cdp-eval.mjs', '--file', file], {
        encoding: 'utf8',
        env: { ...process.env, ADB_SERIAL: SERIAL, CDP_TIMEOUT_MS: '120000' },
    }).trim();
    return JSON.parse(raw);
};
const px = (p, dpr) => [String(Math.round(p.x * dpr)), String(Math.round(p.y * dpr))];
const tap = (p, dpr) => run(['shell', 'input', 'tap', ...px(p, dpr)]);
// A missing rect used to throw `Cannot read properties of undefined`, which killed the run before it
// printed a single result — a suite that dies leaves no evidence. Now it records a red and moves on,
// so the report always says *which* control could not be found and what the sheet looked like then.
const tapCentre = (rect, dpr, label) => {
    if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)) {
        fail.push(`拿不到「${label || '目标'}」的可点矩形 — ${lastBrief}`);
        return false;
    }
    tap({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, dpr);
    return true;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pass = [];
const fail = [];
let lastBrief = '还没读过页面状态';
const briefs = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));
const state = async () => {
    const s = evalFile('devtools/r173-tap-state.js');
    // Every read of the page is recorded, so a red names the state it happened in rather than the
    // reader guessing after the fact.
    lastBrief = `抽屉=${s.drawerOpen ? '开' : '关'} 筛选面=${s.filtersOpen ? '开' : '折'} 宽=${s.sheet ? Math.round(s.sheet.w) : '?'} `
        + `chips=[${(s.chips || []).map((c) => c.sel.replace('#sheet', '').replace('Btn', '')).join(' ')}] `
        + `柱=[${(s.bars || []).map((b) => `${b.date} ${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.w)}x${Math.round(b.h)}${b.on ? '·on' : ''}`).join(' | ')}] `
        + `date=${s.dateValue || '空'} shown=${s.shown}/${s.events}`;
    briefs.push(lastBrief);
    return s;
};
const chipOf = (s, sel) => s.chips.find((c) => c.sel === sel);
const menuOf = (s, sel) => s.menu.find((m) => m.sel === sel);

run(['shell', 'am', 'start', '-W', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1400);

// ---- landscape, drawer open, sheet folded ------------------------------------------
let s = await state();
if (!(s.viewport[0] > s.viewport[1])) {
    run(['shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0']);
    run(['shell', 'settings', 'put', 'system', 'user_rotation', '0']);
    await sleep(400);
    run(['shell', 'settings', 'put', 'system', 'user_rotation', '1']);
    await sleep(1600);
    s = await state();
}
// The drawer has its own precondition line below; keeping it out of this one means a red says which
// of the two broke.
ok('基准：横屏、有事件',
    s.viewport[0] > s.viewport[1] && s.events > 0,
    `${s.viewport.join('x')} events=${s.events} rows=${s.rows}`);
// A cold start leaves the drawer shut, and `r171-tap-open.js` only opens it if `collapsed` is set —
// which the probe could not see while `drawerOpen` read a non-existent id and came back true. Open
// it here and wait for the slide, then measure the funnel from its settled position.
evalFile('devtools/r173-open-drawer.js');
for (let i = 0; i < 12 && !s.drawerOpen; i += 1) {
    await sleep(150);
    s = await state();
}
ok('前置：抽屉已打开', s.drawerOpen, `抽屉=${s.drawerOpen} cls=${s.drawerClass || ''}`);
// The drawer is still laying out when the run starts: the first read saw the sheet at width 0, and
// a funnel rect measured then is not where the button ends up. Let it settle before measuring it.
for (let i = 0; i < 12 && !(s.sheet && s.sheet.w > 0); i += 1) {
    await sleep(150);
    s = await state();
}
if (!s.filtersOpen) {
    const funnel = await evalFile('devtools/r171-tap-open.js');
    // `r171-tap-open.js` already returns a *centre*, not a box — running it through tapCentre added
    // half of a missing width to it and sent the tap to NaN, so the sheet never opened and every
    // criterion after it went red on a coordinate bug that was the probe's.
    tap({ x: funnel.funnel.x, y: funnel.funnel.y }, funnel.dpr);
    // Poll for the class instead of sleeping a fixed 420 ms: the open transition lands later than
    // that on a 505-row list, and reading it mid-animation reports a folded sheet (the same false
    // red `await showModal()` falls into).
    for (let i = 0; i < 12 && !s.filtersOpen; i += 1) {
        await sleep(150);
        s = await state();
    }
}
ok('真点漏斗展开筛选面', s.filtersOpen && s.sheet.w >= 340 && s.sheet.w < 342,
    `sheet=${s.sheet.w} filtersOpen=${s.filtersOpen}`);

// ---- B8: the sort chip cycles the list, and the ⋮ row follows ----------------------
const sortChip = chipOf(s, '#sheetSortBtn');
const before = { order: s.state.sortOrder, text: sortChip?.text, firstRow: null, menu: menuOf(s, '#sortOrderBtn') };
before.firstRow = (await evalFile('devtools/r173-first-row.js')).first;
tapCentre(sortChip, s.dpr);
await sleep(700);
s = await state();
const afterSort = chipOf(s, '#sheetSortBtn');
ok('真点排序 chip 换了序（新→旧 ↔ 旧→新）',
    s.state.sortOrder !== before.order && afterSort?.text !== before.text,
    `${before.order}/${before.text} → ${s.state.sortOrder}/${afterSort?.text}`);
ok('排序 chip 与 ⋮ 菜单行同步（菜单文案跟着走）',
    menuOf(s, '#sortOrderBtn')?.text !== before.menu?.text,
    `menu ${before.menu?.text} → ${menuOf(s, '#sortOrderBtn')?.text}`);
const afterFirstRow = (await evalFile('devtools/r173-first-row.js')).first;
ok('列表第一行真的换了（排序生效，不是只改了标签）',
    afterFirstRow !== before.firstRow, `${before.firstRow} → ${afterFirstRow}`);
tapCentre(chipOf(s, '#sheetSortBtn'), s.dpr);
await sleep(700);
s = await state();
ok('再点一次回到原序', s.state.sortOrder === before.order, s.state.sortOrder);

// ---- B8: the two filter chips light up here AND in the ⋮ menu ----------------------
const star = chipOf(s, '#sheetStarBtn');
ok('收藏 chip 默认未选（透明底、aria-pressed=false）',
    star?.on === false && star?.pressed === 'false'
    && (star?.bg === 'rgba(0, 0, 0, 0)' || star?.bg === 'transparent'),
    `bg=${star?.bg} pressed=${star?.pressed}`);
tapCentre(star, s.dpr);
await sleep(600);
s = await state();
const starOn = chipOf(s, '#sheetStarBtn');
ok('真点收藏 chip：状态开、chip 点亮、⋮ 行同时变 on',
    s.state.starredOnly === true && starOn?.on === true && starOn?.pressed === 'true'
    && menuOf(s, '#starFilterBtn')?.on === true,
    `on=${starOn?.on} bg=${starOn?.bg} menu=${menuOf(s, '#starFilterBtn')?.on}`);
ok('收藏 chip 点亮后底色是实心品牌色（不是保持透明）',
    starOn?.bg !== 'rgba(0, 0, 0, 0)' && starOn?.bg !== 'transparent', starOn?.bg);
ok('筛选确实收窄了列表', s.shown <= s.events && (s.shown === 0 || s.shown < s.events),
    `shown=${s.shown}/${s.events} rows=${s.rows} stars=${s.stars}`);
tapCentre(starOn, s.dpr);
await sleep(600);
s = await state();
ok('再点收藏 chip 回到全部，⋮ 行一起灭',
    s.state.starredOnly === false && chipOf(s, '#sheetStarBtn')?.on === false
    && menuOf(s, '#starFilterBtn')?.on === false, `shown=${s.shown}`);

const trig = chipOf(s, '#sheetTriggerBtn');
tapCentre(trig, s.dpr);
await sleep(600);
s = await state();
ok('真点触发 chip 同样两边同步',
    s.state.triggerOnly === true && chipOf(s, '#sheetTriggerBtn')?.on === true
    && menuOf(s, '#triggerFilterBtn')?.on === true,
    `shown=${s.shown}`);
tapCentre(chipOf(s, '#sheetTriggerBtn'), s.dpr);
await sleep(600);
s = await state();
ok('触发 chip 关掉后回到全部',
    s.state.triggerOnly === false && s.shown === s.events, `shown=${s.shown}/${s.events}`);

// ---- B8: a day bar is a real filter ----------------------------------------------
ok('柱状图容器不再 aria-hidden', s.chartHidden === null, String(s.chartHidden));
const bar = s.bars[s.bars.length - 1];
ok('柱是 ≥40px 高的可点格子', !!bar && bar.h >= 40 && bar.w > 20, `${bar?.w}x${bar?.h} ${bar?.date}`);
const rowsBeforeDay = s.rows;
tapCentre(bar, s.dpr);
await sleep(700);
s = await state();
const picked = s.bars.find((b) => b.on);
ok('真点某一天：日期筛选落到那一天', s.dateValue === bar.date, `${s.dateValue} vs ${bar.date}`);
ok('选中的那根柱自己带 is-on / aria-pressed', picked?.date === bar.date && picked?.pressed === 'true',
    picked ? `${picked.date} pressed=${picked.pressed}` : 'none');
ok('列表只剩那一天', s.shown <= s.events && s.shown > 0 && s.rows <= s.shown,
    `shown=${s.shown} rows=${s.rows} (之前 ${rowsBeforeDay})`);
tapCentre(s.bars.find((b) => b.on), s.dpr);
await sleep(700);
s = await state();
ok('再点同一根柱清掉日期', s.dateValue === '' && s.shown === s.events, `date=${s.dateValue} shown=${s.shown}`);

// ---- C9: the source fold ---------------------------------------------------------
const src = s.source;
ok('来源块在折叠态只留当前一行', src && (src.folded ? src.visible === 1 : src.total === src.visible),
    src ? `total=${src.total} visible=${src.visible} folded=${src.folded}` : 'null');
if (src && src.more && !src.more.hidden) {
    const overflowBefore = s.sheet.overflow;
    // The toggle lives below the fold of a 412 px-tall landscape sheet; a tap at an off-screen y
    // goes nowhere and reads as a dead button. Scroll it in, then re-measure before tapping.
    const scrolled = evalFile('devtools/r173-scroll-more.js');
    await sleep(200);
    s = await state();
    ok('「更多来源」滚一眼就够得着（不是屏外的死按钮）',
        scrolled.inView === true && s.source.more.y + s.source.more.h <= s.viewport[1] + 0.5,
        `${JSON.stringify(scrolled)} 行顶 y=${s.source.more.y} 视口高=${s.viewport[1]}`);
    tapCentre(s.source.more, s.dpr, '更多来源');
    await sleep(500);
    s = await state();
    ok('真点「更多来源」展开其余来源',
        s.state.sourceExpanded === true && s.source.visible === s.source.total
        && s.source.more.aria === 'true',
        `visible=${s.source.visible}/${s.source.total}`);
    ok('展开后文案换成「收起」', /收起/.test(s.source.more.text) || /Fewer/i.test(s.source.more.text),
        s.source.more.text);
    ok('展开确实把内容撑高了（面内溢出变大）', s.sheet.overflow > overflowBefore,
        `${overflowBefore} → ${s.sheet.overflow}px / 面高 ${s.sheet.clientH}`);
    // Expanding pushed the toggle further down the panel; re-scroll and re-measure before the
    // second tap, or it lands below the fold and the collapse never happens.
    evalFile('devtools/r173-scroll-more.js');
    await sleep(200);
    s = await state();
    tapCentre(s.source.more, s.dpr, '收起来源');
    await sleep(500);
    s = await state();
    ok('再点收回一行', s.state.sourceExpanded === false && s.source.visible === 1,
        `visible=${s.source.visible} overflow=${s.sheet.overflow}px`);
} else {
    ok('只有一份来源时不给「更多」行（不发空按钮）', !src || src.more?.hidden === true,
        src ? `total=${src.total} hidden=${src.more?.hidden}` : 'null');
}

// ---- B5: a normal stick keeps its shape ------------------------------------------
// A normal stick must not enter the window: no spacer, and the first page is on screen. `rows` is
// the DOM count and the touch list only builds a page (60) until the thumb scrolls, so equality with
// the filtered count was never the shipped behaviour.
ok('500 事件级的真目录不进窗口（无 spacer、第一页在）',
    s.state.windowed === false && s.list?.hasSpacer === false && s.rows > 0 && s.rows <= s.shown,
    `windowed=${s.state.windowed} rows=${s.rows} shown=${s.shown}`);

// ---- restore: sort back to newest, sheet left open as found ----------------------
if (s.state.sortOrder !== 'newest') {
    tapCentre(chipOf(s, '#sheetSortBtn'), s.dpr);
    await sleep(600);
}
console.log('pass ' + pass.length);
pass.forEach((p) => console.log('  ✓ ' + p));
console.log('fail ' + fail.length);
fail.forEach((f) => console.log('  ✗ ' + f));
console.log('--- 每次读页（找红的时候看它） ---');
briefs.forEach((b, i) => console.log(`  ${i}. ${b}`));

// R171 · real fingers on the landscape filter sheet:
//   funnel opens it, 收起 closes it, a type row filters, a date chip filters, 重置 resets,
//   and the calendar chip opens flatpickr where the chip is.
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
const evalExpr = (expr) => execFileSync('node', ['devtools/cdp-eval.mjs', expr], {
    encoding: 'utf8',
    env: { ...process.env, ADB_SERIAL: SERIAL, CDP_TIMEOUT_MS: '120000' },
}).trim();
const px = (p, dpr) => [String(Math.round(p.x * dpr)), String(Math.round(p.y * dpr))];
const tap = (p, dpr) => run(['shell', 'input', 'tap', ...px(p, dpr)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run(['shell', 'am', 'start', '-W', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1200);

const pass = [];
const fail = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));
const state = () => evalFile('devtools/r171-tap-state.js');
// R172: the sheet counts its own 1px divider outside its 340 content box, so the border box is
// 340.76 at DPR 2.625 — the check is about the content width, not the rounded border box.
const sheetWide = (w) => Math.abs(w - 340.76) <= 0.5;

const openState = evalFile('devtools/r171-tap-open.js');
const dpr = openState.dpr;
ok('基准：横屏、抽屉开、筛选收起、列表有行',
    openState.viewport[0] > openState.viewport[1] && openState.filtersOpen === false
    && Math.round(openState.sheetWidth) === 0 && openState.events > 0,
    `${openState.viewport.join('x')} events=${openState.events} sheet=${openState.sheetWidth}`);

// ---- funnel opens -------------------------------------------------------------------
tap(openState.funnel, dpr);
await sleep(420);
let s = await state();
ok('真点漏斗展开整面', s.open === true && sheetWide(s.width) && s.inert === false,
    `open=${s.open} width=${s.width} inert=${s.inert}`);
ok('展开后漏斗让位、收起可用', s.funnelDisplay === 'none' && s.collapse && s.collapse.w >= 40,
    `funnel=${s.funnelDisplay} collapse=${s.collapse?.w}`);
ok('展开不改列表几何',
    Math.abs(s.list.left - openState.list.left) <= 1 && Math.abs(s.list.width - openState.list.width) <= 1
    && Math.abs(s.list.height - openState.list.height) <= 1,
    `${openState.list.width}x${openState.list.height} → ${s.list.width}x${s.list.height}`);

// ---- type segment -------------------------------------------------------------------
const total = s.total;
tap(s.seg, dpr);
await sleep(220);
s = await state();
ok('真点哨兵段生效', s.type === 'SentryClips' && s.events > 0 && s.events < total,
    `${total} → ${s.events} type=${s.type}`);
ok('计数/摘要/重置跟随', s.count.includes(String(s.events)) && s.summary.includes(String(s.events))
    && s.resetDisabled === false && s.tagHidden === false,
    `count=${s.count} summary=${s.summary} reset=${s.resetDisabled}`);
const filteredEvents = s.events;

// ---- date chip ----------------------------------------------------------------------
tap(s.date, dpr);
await sleep(220);
s = await state();
ok('真点日期 chip 生效', !!s.dateValue && s.events <= filteredEvents && s.events > 0,
    `date=${s.dateValue} ${filteredEvents} → ${s.events}`);

// ---- reset --------------------------------------------------------------------------
tap(s.reset, dpr);
await sleep(260);
s = await state();
ok('真点重置恢复全部', s.type === '' && s.dateValue === '' && s.events === total
    && s.resetDisabled === true && s.tagHidden === true,
    `type=${s.type} date=${s.dateValue} events=${s.events}/${total}`);

// ---- calendar -----------------------------------------------------------------------
tap(s.calendar, dpr);
await sleep(420);
s = await state();
ok('真点日历 chip 打开日历', s.fpOpen === true && s.fpRect && s.fpRect.w > 200,
    `open=${s.fpOpen} rect=${s.fpRect ? Math.round(s.fpRect.w) + 'x' + Math.round(s.fpRect.h) : 'none'}`);
// R171b: a 298-tall calendar cannot fit above or below a chip at y≈155 in a 412-tall viewport,
// so landscape centres it instead of anchoring it.
ok('日历在横屏居中而不是贴着 chip 的上下方',
    !!s.fpRect
    && Math.abs(s.fpRect.left - (openState.viewport[0] - s.fpRect.w) / 2) <= 8
    && Math.abs(s.fpRect.top - (openState.viewport[1] - s.fpRect.h) / 2) <= 8,
    s.fpRect ? `cal=${Math.round(s.fpRect.left)},${Math.round(s.fpRect.top)} `
        + `size=${Math.round(s.fpRect.w)}x${Math.round(s.fpRect.h)}` : 'none');
// R171b: the old anchored placement put the calendar's bottom at ~495 on a 412-tall screen.
ok('日历完整落在屏内（R171b）',
    !!s.fpRect && s.fpRect.top >= 0.5 && s.fpRect.bottom <= openState.viewport[1] - 0.5
    && s.fpRect.left >= 0 && s.fpRect.right <= openState.viewport[0] - 0.5,
    s.fpRect ? `rect=${Math.round(s.fpRect.left)},${Math.round(s.fpRect.top)} `
        + `${Math.round(s.fpRect.w)}x${Math.round(s.fpRect.h)} bottom=${Math.round(s.fpRect.bottom)} `
        + `viewport=${openState.viewport.join('x')}` : 'none');
evalExpr('window.viewer.flatpickrInstance.close()');
await sleep(200);

// ---- collapse -----------------------------------------------------------------------
s = await state();
tap(s.collapse, dpr);
await sleep(420);
s = await state();
ok('真点收起折回抽屉', s.open === false && Math.round(s.width) === 0 && s.inert === true,
    `open=${s.open} width=${s.width} inert=${s.inert}`);
ok('收起把漏斗还给抽屉', s.funnelDisplay !== 'none', s.funnelDisplay);

// ---- reopen -------------------------------------------------------------------------
const st = await state();
tap(st.funnel, dpr);
await sleep(420);
s = await state();
ok('再次真点漏斗仍能展开', s.open === true && sheetWide(s.width), `width=${s.width}`);

console.log(JSON.stringify({ pass, fail }));

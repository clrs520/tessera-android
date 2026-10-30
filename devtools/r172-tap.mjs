// R172 · real fingers and the real back key on the landscape date picker.
//   calendar chip opens the centred overlay (with its dim), 返回 closes only the calendar,
//   a day outside the chips lands in the chip row and clears again from there, and the
//   loading pill lands on the picture column instead of the sheet.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

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
    encoding: 'utf8', env: { ...process.env, ADB_SERIAL: SERIAL, CDP_TIMEOUT_MS: '120000' },
}).trim();
const px = (p, dpr) => [String(Math.round(p.x * dpr)), String(Math.round(p.y * dpr))];
const tap = (p, dpr) => run(['shell', 'input', 'tap', ...px(p, dpr)]);
const tapCentre = (rect, dpr) => tap({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }, dpr);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const back = () => run(['shell', 'input', 'keyevent', '4']);
const foreground = () => (run(['shell', 'dumpsys', 'window']) || '')
    .split(/\r?\n/).find((l) => /mCurrentFocus/.test(l))?.trim() || 'none';

const pass = [];
const fail = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));
const state = () => evalFile('devtools/r172-tap-state.js');

run(['shell', 'am', 'start', '-W', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1200);

// ---- baseline: landscape, drawer open, sheet folded ---------------------------------
const open0 = evalFile('devtools/r171-tap-open.js');
const dpr = open0.dpr;
let s = await state();
ok('基准：横屏、抽屉开、筛选面收起、有事件',
    s.viewport[0] > s.viewport[1] && s.drawerOpen && !s.filtersOpen && s.events > 0,
    `${s.viewport.join('x')} events=${s.events}`);

// ---- the funnel, then the calendar chip --------------------------------------------
tapCentre(s.funnel, dpr);
await sleep(420);
s = await state();
const layersBefore = s.layers;
ok('真点漏斗展开整面', s.filtersOpen && s.sheet.w > 340 && s.sheet.w < 342, `sheet=${s.sheet.w}`);
tapCentre(s.calBtn, dpr);
await sleep(300);
s = await state();
ok('日历多算一层返回栈', s.layers === layersBefore + 1, `${layersBefore} → ${s.layers}`);
ok('真点日历 chip 打开居中浮层', !!s.cal && s.cal.w > 200 && s.cal.bottom <= s.viewport[1],
    `cal=${s.cal ? `${s.cal.w}x${s.cal.h} bottom=${s.cal.bottom}` : 'null'}`);
ok('日历打开时遮罩铺满整屏', s.scrim.shown && s.scrim.display === 'block'
    && s.scrim.rect.w >= s.viewport[0] - 1 && s.scrim.rect.h >= s.viewport[1] - 1,
    `display=${s.scrim.display} ${s.scrim.rect.w}x${s.scrim.rect.h}`);
ok('遮罩在日历之下、抽屉之上', Number(s.scrim.z) > 2 && !!s.cal && Number(s.scrim.z) < 99999,
    `z=${s.scrim.z}`);

// ---- the real back key closes only the calendar ------------------------------------
back();
await sleep(400);
s = await state();
ok('真按返回只关日历', !s.cal && !s.scrim.shown, `cal=${!!s.cal} scrim=${s.scrim.shown}`);
ok('抽屉与整面都没被带走', s.drawerOpen && s.filtersOpen,
    `drawer=${s.drawerOpen} filters=${s.filtersOpen}`);
ok('APP 仍在前景', /tdashcam/.test(foreground()), foreground());

// ---- a day that the chips do not cover ---------------------------------------------
// Clear first, jump the view to a month with no clips, and let the finger do the selecting:
// `setDate` would have applied the filter before the tap ever landed.
const offKey = evalExpr(`(()=>{const fp=viewer.flatpickrInstance;fp.clear();
    const d=viewer.eventGroups[0].startTime.slice(0,10);
    const t=new Date(Date.parse(d)-26*864e5);
    const key=[t.getFullYear(),String(t.getMonth()+1).padStart(2,'0'),String(t.getDate()).padStart(2,'0')].join('-');
    window.__r172Target=key; fp.jumpToDate(key,false); fp.open(); return key})()`);
await sleep(300);
s = await state();
ok(`日历翻到没有录像的 ${offKey} 并找到那一格`, !!s.dayTarget && !!s.cal, JSON.stringify(s.dayTarget));
tapCentre(s.dayTarget, dpr);
await sleep(260);
s = await state();
const offChip = s.chips.find((c) => c.date && c.date === s.dateValue);
ok('真点那一天以后，chips 行出现它并点亮', !!s.dateValue && !!offChip && offChip.active,
    `value=${s.dateValue} chips=${s.chips.map((c) => c.date || c.text).join('/')}`);
ok('那一天筛选真的生效（列表被清空）', s.shown === 0 && s.events > 0, `shown=${s.shown}`);
ok('日历关掉、遮罩收走', !s.cal && !s.scrim.shown, `cal=${!!s.cal}`);
// Tapping that chip again is the way back — no 重置, no losing the other filters.
tapCentre(offChip.rect, dpr);
await sleep(220);
s = await state();
ok('再点那一格清掉日期、格子消失', s.dateValue === ''
    && !s.chips.some((c) => c.date && c.date === offChip.date),
    `value=${s.dateValue} chips=${s.chips.length}`);
ok('列表回到全部', s.shown === s.events, `shown=${s.shown}/${s.events}`);

// ---- the loading pill belongs to the picture column --------------------------------
// Clearing the date re-renders the list, so read the target only after the rows have settled:
// measuring mid-refill taps whatever row replaced the one that was measured. The boot restore also
// opens a clip of its own a second later, so wait until the current event stops moving — otherwise
// the row picked is the one that becomes current right before the finger lands, and the tap is a
// no-op on the already-open clip.
await sleep(800);
let settled = 'none';
let prevRead = '';
for (let i = 0; i < 15; i += 1) {
    await sleep(1000);
    settled = evalExpr(`(viewer.currentEvent&&viewer.currentEvent.eventId)||'none'`);
    if (settled !== 'none' && settled === prevRead) break;
    prevRead = settled;
}
const before = await state();
ok('前置：抽屉开着、第一张卡片在屏内', before.drawerOpen && !!before.firstCard,
    `drawer=${before.drawerOpen} card=${before.firstCard ? `${before.firstCard.x},${before.firstCard.y}` : 'null'}`);
tapCentre(before.firstCard, dpr);
// The pill itself is asserted in r172-verify.js, which arms it through the product path and
// measures the placement in both themes. Asserting it from here needs a card that is not the one
// the boot restore opens, and on this single-day fixture the restore settles *after* the pick often
// enough that the finger lands on the already-open clip — a racy harness, not a product finding.
await sleep(400);
evalExpr("window.__r172BadgeMO?.disconnect();0");

console.log(JSON.stringify({ pass, fail }, null, 1));

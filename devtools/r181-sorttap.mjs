// R181 · reproduce the crash in r173-tap.mjs: after a real finger on the 排序 chip, is the filter
// sheet still open, and are its chips still in the DOM? If they vanish the chip tap is closing the
// sheet (a product bug of the R89/R146 family), and the tap suite's `chipOf(...) → undefined` is the
// symptom, not the cause.
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const SERIAL = process.env.ADB_SERIAL || 'emulator-5554';
const run = (args) => execFileSync(ADB, ['-s', SERIAL, ...args], { encoding: 'utf8' });
const evalFile = (file) => {
    const raw = execFileSync('node', ['devtools/cdp-eval.mjs', '--file', file], {
        encoding: 'utf8', env: { ...process.env, ADB_SERIAL: SERIAL, CDP_TIMEOUT_MS: '120000' },
    }).trim();
    return JSON.parse(raw);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = [];

let s = await evalFile('devtools/r173-tap-state.js');
if (!(s.viewport[0] > s.viewport[1])) {
    run(['shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0']);
    run(['shell', 'settings', 'put', 'system', 'user_rotation', '0']);
    await sleep(400);
    run(['shell', 'settings', 'put', 'system', 'user_rotation', '1']);
    await sleep(1800);
    s = await evalFile('devtools/r173-tap-state.js');
}
report.push({ step: '基准', vp: s.viewport, drawerOpen: s.drawerOpen, filtersOpen: s.filtersOpen,
    sheetW: s.sheet && Math.round(s.sheet.w), chips: (s.chips || []).map((c) => c.sel) });

const funnel = await evalFile('devtools/r171-tap-open.js');
run(['shell', 'input', 'tap', String(Math.round(funnel.funnel.x * funnel.dpr)),
    String(Math.round(funnel.funnel.y * funnel.dpr))]);
await sleep(600);
s = await evalFile('devtools/r173-tap-state.js');
report.push({ step: '真点漏斗展开', filtersOpen: s.filtersOpen, sheetW: s.sheet && Math.round(s.sheet.w),
    chips: (s.chips || []).map((c) => `${c.sel}${c.on ? '·on' : ''}`) });

const sortChip = (s.chips || []).find((c) => c.sel === '#sheetSortBtn');
report.push({ step: '排序 chip 是否拿得到', found: !!sortChip, rect: sortChip && {
    x: Math.round(sortChip.x), y: Math.round(sortChip.y), w: Math.round(sortChip.w), h: Math.round(sortChip.h) },
    text: sortChip && sortChip.text });
if (sortChip) {
    run(['shell', 'input', 'tap', String(Math.round((sortChip.x + sortChip.w / 2) * s.dpr)),
        String(Math.round((sortChip.y + sortChip.h / 2) * s.dpr))]);
    await sleep(800);
    s = await evalFile('devtools/r173-tap-state.js');
    report.push({ step: '真点排序之后', filtersOpen: s.filtersOpen, sheetW: s.sheet && Math.round(s.sheet.w),
        chips: (s.chips || []).map((c) => `${c.sel}${c.on ? '·on' : ''}`),
        sortOrder: s.state && s.state.sortOrder, menuSort: (s.menu || [])
            .find((m) => m.sel === '#sortOrderBtn') });
}
console.log(JSON.stringify(report, null, 1));

// R164 · real-finger pass over the floating filter panel. The layout suite answers stacking with
// elementFromPoint; this one proves the touch actually lands: `input tap` at the chip's centre,
// then the DOM must show that chip's filter applied and the drawer still open (a scrim hit would
// close the drawer instead).
import { execFileSync } from 'node:child_process';

const ADB = process.env.ADB || 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const SERIAL = process.env.ADB_SERIAL || 'emulator-5554';
const run = (args) => execFileSync(ADB, ['-s', SERIAL, ...args], { encoding: 'utf8' });
const evalFile = (file) => {
    const raw = execFileSync('node', ['devtools/cdp-eval.mjs', '--file', file], {
        encoding: 'utf8',
        env: { ...process.env, ADB_SERIAL: SERIAL },
    }).trim();
    return JSON.parse(raw);
};
const tap = (p, dpr) => run(['shell', 'input', 'tap', String(Math.round(p.x * dpr)), String(Math.round(p.y * dpr))]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run(['shell', 'am', 'start', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1500);

const pass = [];
const fail = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));

const setup = evalFile('devtools/r164-tap-setup.js');
ok('基准：横屏', setup.viewport[0] > setup.viewport[1], setup.viewport.join('x'));
ok('基准：面板已打开（absolute）', setup.filtersOpen && setup.display === 'flex', `${setup.filtersOpen}/${setup.display}`);
const before = evalFile('devtools/r164-tap-state.js');
ok('基准：有事件卡片', before.cards > 0, before.cards);

tap(setup.funnel, setup.dpr);
await sleep(600);
const closed = evalFile('devtools/r164-tap-state.js');
ok('真点漏斗：筛选收起', !closed.filtersOpen && closed.stackDisplay === 'contents', `${closed.filtersOpen}/${closed.stackDisplay}`);
ok('真点漏斗：抽屉没被误关', closed.drawerOpen, closed.drawerOpen);

tap(setup.funnel, setup.dpr);
await sleep(600);
const reopened = evalFile('devtools/r164-tap-state.js');
ok('真点漏斗：面板重新浮出', reopened.filtersOpen && reopened.stackPosition === 'absolute', `${reopened.filtersOpen}/${reopened.stackPosition}`);

tap(setup.target, setup.dpr);
await sleep(700);
const filtered = evalFile('devtools/r164-tap-state.js');
ok('真点面板内日期 chip：抽屉仍开', filtered.drawerOpen, filtered.drawerOpen);
ok('真点面板内日期 chip：面板仍开', filtered.filtersOpen && filtered.stackPosition === 'absolute', `${filtered.filtersOpen}/${filtered.stackPosition}`);
ok('真点面板内日期 chip：筛选生效', filtered.activeDateValue === setup.targetDate, `${filtered.activeDateValue} vs ${setup.targetDate}`);
ok('真点面板内日期 chip：列表只剩该日期', filtered.cards > 0 && filtered.eventIds.every((id) => id.includes(setup.targetDate)), `${filtered.cards} | ${filtered.eventIds.slice(0, 3).join(' / ')}`);

tap(setup.all, setup.dpr);
await sleep(700);
const cleared = evalFile('devtools/r164-tap-state.js');
ok('真点「全部日期」：筛选清空', cleared.activeDateValue === '', `${cleared.activeDateValue}/${cleared.activeDate}`);
ok('真点「全部日期」：列表恢复', cleared.cards >= before.cards, `${cleared.cards} >= ${before.cards}`);

tap(setup.funnel, setup.dpr);
await sleep(500);
evalFile('devtools/r164-tap-cleanup.js');

console.log(JSON.stringify({ pass, fail }));

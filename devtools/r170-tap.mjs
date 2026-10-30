// R170 · real finger on a hole:
//   * a tap explains it and does not move the playhead;
//   * a drag that starts on the same pixel still scrubs.
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
const swipe = (a, b, dpr, ms) => run(['shell', 'input', 'swipe', ...px(a, dpr), ...px(b, dpr), String(ms)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run(['shell', 'am', 'start', '-W', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1200);

const pass = [];
const fail = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));

const setup = evalFile('devtools/r169-tap-setup.js');
ok('基准：有事件、尺子上有缺口、进度条在屏上', setup.cards.length >= 1 && setup.majors >= 1 && setup.overlayShown,
    `${setup.bar.w.toFixed(0)}x${setup.bar.h.toFixed(0)} majors=${setup.majors}`);

evalExpr(`(()=>{const v=window.viewer;window.__r170toasts=[];if(!v.__r170origToast)v.__r170origToast=v.showToast;v.showToast=function(t){window.__r170toasts.push(String(t));return v.__r170origToast.apply(this,arguments);};return 'ok';})()`);

// ---- tap a hole: speaks, does not seek ----------------------------------------------
const armedTap = evalFile('devtools/r169-arm-swipe.js');
await sleep(700);
const beforeTap = evalFile('devtools/r170-state.js');
tap(armedTap.from, setup.dpr);
await sleep(500);
const afterTap = evalFile('devtools/r170-state.js');
ok('点缺口会弹说明', afterTap.toasts.some((t) => /缺|missing/i.test(t)), JSON.stringify(afterTap.toasts));
const barFromPlayer = afterTap.total > 0 ? Math.round(afterTap.current / afterTap.total * 100) : 0;
ok('点缺口不移动播放头', afterTap.timeLabel === beforeTap.timeLabel
    && Math.abs(afterTap.current - beforeTap.current) <= 0.2
    && Math.abs(afterTap.valueNow - barFromPlayer) <= 3,
    `${beforeTap.timeLabel} -> ${afterTap.timeLabel} | ${beforeTap.valueNow}% -> ${afterTap.valueNow}% (player ${barFromPlayer}%) | ${beforeTap.current.toFixed(2)} -> ${afterTap.current.toFixed(2)}`);

// ---- drag from the same hole: still scrubs -----------------------------------------
const armedSwipe = evalFile('devtools/r169-arm-swipe.js');
await sleep(350);
const beforeSwipe = evalFile('devtools/r170-state.js');
swipe(armedSwipe.from, armedSwipe.to, setup.dpr, 600);
await sleep(700);
const afterSwipe = evalFile('devtools/r170-state.js');
const expected = Math.round((armedSwipe.to.x - armedSwipe.bar.x) / armedSwipe.bar.w * 100);
ok('从缺口上起手拖动仍能拉进度条', afterSwipe.valueNow >= expected - 8 && afterSwipe.valueNow > beforeSwipe.valueNow + 20,
    `${beforeSwipe.valueNow}% -> ${afterSwipe.valueNow}% (release ≈${expected}%)`);

evalFile('devtools/r170-cleanup.js');
console.log(JSON.stringify({ pass, fail }));

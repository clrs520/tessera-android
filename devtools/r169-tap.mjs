// R169 · real finger, two claims:
//   1) a drag that starts on a hole marker moves the ruler (it used to be swallowed);
//   2) one tap on a card switches the event (no second tap needed).
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
const evalExpr = (expr) => {
    const raw = execFileSync('node', ['devtools/cdp-eval.mjs', expr], {
        encoding: 'utf8',
        env: { ...process.env, ADB_SERIAL: SERIAL, CDP_TIMEOUT_MS: '120000' },
    }).trim();
    return raw;
};
const tap = (p, dpr) => run(['shell', 'input', 'tap', ...px(p, dpr)]);
const swipe = (a, b, dpr, ms) => run(['shell', 'input', 'swipe', ...px(a, dpr), ...px(b, dpr), String(ms)]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

run(['shell', 'am', 'start', '-n', 'com.tdashcam.studio/.MainActivity']);
await sleep(1200);

const pass = [];
const fail = [];
const ok = (name, cond, detail) => (cond ? pass : fail).push(name + (detail === undefined ? '' : ' = ' + detail));

const setup = evalFile('devtools/r169-tap-setup.js');
ok('基准：横竖屏正常、有卡片、尺子上有缺口', setup.cards.length >= 2 && setup.majors >= 1,
    `${setup.bar.w.toFixed(0)}x${setup.bar.h.toFixed(0)} majors=${setup.majors} cards=${setup.cards.length}`);
ok('基准：进度条真的在屏上（否则滑不到它）', setup.overlayShown === true, String(setup.overlayShown));

// ---- 1. real drag starting on a hole ------------------------------------------------
const armed = evalFile('devtools/r169-arm-swipe.js');
ok('基准：起手前进度条仍在屏上、落点在尺子上', armed.overlayShown && /progress|gap/.test(armed.center),
    `overlay=${armed.overlayShown} center=${armed.center}`);
const before = evalFile('devtools/r169-tap-state.js');
swipe(armed.from, armed.to, setup.dpr, 600);
await sleep(700);
const after = evalFile('devtools/r169-tap-state.js');
const expected = Math.round((armed.to.x - armed.bar.x) / armed.bar.w * 100);
ok('从缺口上起手拖动，尺子真的跟着走', after.valueNow > before.valueNow + 15 || after.valueNow >= expected - 8,
    `${before.valueNow}% -> ${after.valueNow}% (release ≈${expected}%)`);
ok('拖动落点与手指位置一致', Math.abs(after.valueNow - expected) <= 8, `${after.valueNow}% vs ${expected}%`);

// ---- 2. one real tap switches the event ---------------------------------------------
const stateNow = evalFile('devtools/r169-tap-state.js');
const currentId = stateNow.current;
const ordered = setup.cards.map((c) => c.id).filter((id) => id !== currentId);
const targets = ordered.slice(0, 2);
for (const target of targets) {
    evalFile('devtools/r169-drawer-open.js');
    await sleep(450);
    const state = evalFile('devtools/r169-tap-setup.js');
    const card = state.cards.find((c) => c.id === target);
    if (!card) { ok(`基准：找得到卡片 ${target}`, false, 'missing'); continue; }
    const pre = evalFile('devtools/r169-tap-state.js');
    ok(`基准：点之前不在 ${target.slice(-18)}`, pre.current !== target, String(pre.current));
    evalExpr(`window.__r169target=${JSON.stringify(target)}; "ok"`);
    const tTap = Date.now();
    tap({ x: card.cx, y: card.cy }, state.dpr);
    const waited = evalFile('devtools/r169-wait-state.js');
    ok(`真点一次即切到 ${target.slice(-18)}`, waited.current === target,
        `${Date.now() - tTap}ms cur=${waited.current}`);
}

// put the real markers back for whatever runs next
evalFile('devtools/r169-tap-cleanup.js');

console.log(JSON.stringify({ pass, fail, before: before.valueNow, after: after.valueNow, expected }));

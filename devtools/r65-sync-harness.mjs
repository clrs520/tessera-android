// R65 mechanism harness: drives the *shipped* syncAllPlayers against fake media elements on a virtual
// clock, and compares it with the rule this round replaced. No device, no decoder — it answers one
// question only: how many real seeks does the drift corrector issue per second when six feeds are
// playing with pipeline jitter, and does it ever aim a tile onto a clock that has stopped.
//
//   node devtools/r65-sync-harness.mjs                 # both builds, all scenarios
//
// The legacy side is a verbatim transcription of the branch R65 removed (doc/ANDROID_CN.md 第 3234 行
// describes it: skip suspended + skip seeking + tolerance 0.35 s on a phone / 0.1 s on desktop).
// Everything else — the state machine, the counters, describeFeeds — is the real script.js, evaluated
// in a vm with a stub DOM, so the numbers are the shipped code's, not a paraphrase of it.

import fs from 'node:fs';
import vm from 'node:vm';

const SRC = process.argv[2] || 'TDashcamStudio/src/script.js';
const TICK_MS = 100;
// Where a page's clock already is by the time playback starts. See `run()`.
const UPTIME_MS = 30000;

function makeSandbox(touch) {
    const timers = [];
    const clock = { now: 0 };
    const logs = { warn: [], error: [] };

    const fakeNode = (id, tag = 'DIV') => {
        const el = {
            id, tagName: tag, style: { setProperty() {}, removeProperty() {}, getPropertyValue: () => '' },
            classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
            dataset: {}, children: [], textContent: '', innerHTML: '', value: '', checked: false, hidden: false,
            listeners: {},
            addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); },
            removeEventListener(name, fn) { this.listeners[name] = (this.listeners[name] || []).filter(f => f !== fn); },
            dispatch(name, ev = {}) { (this.listeners[name] || []).forEach(fn => fn({ target: this, type: name, ...ev })); },
            appendChild(c) { this.children.push(c); return c; },
            removeChild() {}, remove() {},
            setAttribute() {}, getAttribute: () => null, removeAttribute() {},
            querySelector: () => null, querySelectorAll: () => [], closest: () => null,
            insertAdjacentHTML() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 225, right: 400, bottom: 225 }),
            focus() {}, blur() {}, click() {}, scrollTo() {}, scrollIntoView() {},
            offsetWidth: 400, offsetHeight: 225, clientWidth: 400, clientHeight: 225, scrollTop: 0,
        };
        return el;
    };

    // A feed that behaves like a `<video>` pointed at the loopback server: a `currentTime` write is a
    // real seek that costs 500 ms of wall clock (measured 404–1617 ms on a phone) before the new
    // position is readable, and `seeking` is true the whole time.
    const makePlayer = id => {
        const el = fakeNode(id, 'VIDEO');
        let time = 0;
        let seekTo = null;
        let seekDue = 0;
        const stats = { writes: 0, rateWrites: 0, plays: 0 };
        Object.defineProperty(el, 'currentTime', {
            get: () => time,
            set(v) {
                if (typeof v !== 'number' || !isFinite(v)) throw new Error(`bad currentTime ${v} on ${id}`);
                stats.writes++;
                // Chrome answers a read of `currentTime` with the seek target straight away; what it
                // does not do is pretend the seek is over. `seeking` stays true for the whole trip.
                time = v;
                seekDue = clock.now + el.seekCostMs;
                el.seeking = true;
                el.dispatchEvent2('seeking');
            },
            enumerable: true,
        });
        Object.defineProperty(el, 'playbackRate', {
            get: () => el._rate,
            set(v) { if (v !== el._rate) { el._rate = v; stats.rateWrites++; } },
            enumerable: true,
        });
        Object.assign(el, {
            src: '', _rate: 1, paused: true, seeking: false, readyState: 4, networkState: 1,
            duration: 60, videoWidth: 1920, videoHeight: 1080, error: null, crossOrigin: null,
            ended: false, muted: false, volume: 1, seekCostMs: 500, stats,
            buffered: { length: 1, start: () => 0, end: () => Math.min(el.duration, time + 12) },
            seekable: { length: 0, start: () => 0, end: () => 0 },
            play() { el.paused = false; stats.plays++; return Promise.resolve(); },
            pause() { el.paused = true; return undefined; },
            load() {},
            getVideoPlaybackQuality: () => ({ droppedVideoFrames: el.dropped || 0, totalVideoFrames: 1000 }),
            // internal: the element's own event dispatch, named so the DOM stub's `dispatch` stays free
            dispatchEvent2(name) { el.dispatch(name, {}); },
            step(dt) {
                // the seek has been "in flight" for seekCostMs; that is when the element says so
                if (el.seeking && clock.now >= seekDue) {
                    el.seeking = false;
                    el.dispatchEvent2('seeked');
                }
                if (!el.paused && !el.seeking && !el.stalled) time += dt * el._rate;
            },
            // the clock moving on its own (the decoder's own progress, or a sub-frame nudge), which is
            // deliberately NOT a `currentTime` write — that is the whole point of the counter
            setTime(v) { time = v; },
            nudge(d) { time += d; },
        });
        return el;
    };

    const IDS = {
        'front-player': 'front', 'back-player': 'back', 'left-player': 'left', 'right-player': 'right',
        'left-pillar-player': 'left_pillar', 'right-pillar-player': 'right_pillar',
    };
    const players = {};
    for (const [domId, camera] of Object.entries(IDS)) {
        players[camera] = makePlayer(domId);
        players[camera].camera = camera;
    }
    const pool = {};

    const document = {
        getElementById(id) {
            if (IDS[id]) return players[IDS[id]];
            return pool[id] ||= fakeNode(id);
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: tag => fakeNode('', String(tag).toUpperCase()),
        addEventListener() {}, removeEventListener() {},
        documentElement: fakeNode('html'), body: fakeNode('body'),
        head: fakeNode('head'), title: '', cookie: '',
        readyState: 'complete', fonts: { ready: Promise.resolve() },
    };

    const sandbox = {
        console: { log() {}, warn: (...a) => logs.warn.push(a.join(' ')), error: (...a) => logs.error.push(a.join(' ')), info() {}, debug() {} },
        document,
        navigator: { userAgent: touch
            ? 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            language: 'zh-CN', maxTouchPoints: touch ? 5 : 0 },
        location: { href: 'http://localhost/', protocol: 'http:', search: '', origin: 'http://localhost' },
        performance: { now: () => clock.now, mark() {}, measure() {} },
        setTimeout: (fn, ms) => { timers.push({ due: clock.now + (ms || 0), fn, id: timers.length + 1 }); return timers.length; },
        clearTimeout: id => { const t = timers.find(t => t.id === id); if (t) t.dead = true; },
        setInterval: () => 0, clearInterval: () => {},
        requestAnimationFrame: fn => sandbox.setTimeout(fn, 16), cancelAnimationFrame: () => {},
        localStorage: { _m: {}, getItem(k) { return Object.prototype.hasOwnProperty.call(this._m, k) ? this._m[k] : null; }, setItem(k, v) { this._m[k] = String(v); }, removeItem(k) { delete this._m[k]; }, clear() { this._m = {}; } },
        matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {}, removeEventListener() {} }),
        addEventListener() {}, removeEventListener() {},
        getComputedStyle: () => ({ getPropertyValue: () => '', fontSize: '14px' }),
        alert() {}, fetch: () => Promise.reject(new Error('no network in harness')),
        URL: { createObjectURL: () => 'blob:stub', revokeObjectURL() {} },
        Blob: class { }, FileReader: class { }, Image: class { }, Worker: class { },
        Date, Math, JSON, Promise, TextEncoder, TextDecoder,
        Intl, encodeURIComponent, decodeURIComponent, btoa: s => Buffer.from(s, 'binary').toString('base64'), atob: s => Buffer.from(s, 'base64').toString('binary'),
        parseFloat, parseInt, isNaN, isFinite, String, Number, Boolean, Array, Object, Error, TypeError, RangeError, Map, Set, WeakMap, WeakSet, Symbol, RegExp, Buffer,
    };
    sandbox.window = sandbox;
    sandbox.self = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.top = sandbox;
    if (touch) sandbox.__TAURI__ = { core: { invoke: () => Promise.resolve() } };
    sandbox.__TAURI_INTERNALS__ = { invoke: () => Promise.resolve(), transformCallback: () => () => {} };

    const context = vm.createContext(sandbox);
    // `class` and `const` at a script's top level are lexical, not window properties, so the only way
    // out of a vm script is a tail statement written in the same script.
    vm.runInContext(
        fs.readFileSync(SRC, 'utf8')
        + '\n;globalThis.__exports = { MultiCameraPlayer, isTouchShellRuntime, ALL_CAMERA_VIEWS };\n',
        context, { filename: SRC });

    const flush = () => {
        for (;;) {
            const ready = timers.filter(t => !t.dead && t.due <= clock.now);
            if (!ready.length) return;
            ready.forEach(t => { t.dead = true; try { t.fn(); } catch (e) { logs.error.push(String(e)); } });
        }
    };

    return { sandbox, exports: sandbox.__exports, clock, players, logs, flush, timers,
        totalWrites: () => Object.values(players).reduce((n, p) => n + p.stats.writes, 0), };
}

/** Deterministic per-(tick, camera) noise in wall-clock seconds, so both builds see the same jitter. */
function noise(amp) {
    return (i, cam) => {
        let h = 2166136261;
        const s = `${i}:${cam}`;
        for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); }
        return amp * ((h >>> 8) % 2000 / 1000 - 1);   // [-amp, +amp)
    };
}

/** The rule that shipped until this round: one comparison, and a seek whenever it fails. */
function legacySync(h, mcp) {
    const now = h.clock.now;
    if (now - mcp.lastSyncTime < 100) return;
    mcp.lastSyncTime = now;
    const main = mcp.players[mcp.activeCamera];
    if (!main || !main.src) return;
    const currentTime = main.currentTime;
    const tolerance = h.exports.isTouchShellRuntime() ? 0.35 : 0.1;
    Object.keys(mcp.players).forEach(key => {
        if (key === mcp.activeCamera || mcp.suspendedFeeds.has(key)) return;
        const player = mcp.players[key];
        if (!player || !player.src || player.seeking) return;
        if (Math.abs(currentTime - player.currentTime) > tolerance) player.currentTime = currentTime;
    });
}

function build(h, { layout = 'grid4', active = 'front' } = {}) {
    const mcp = new h.exports.MultiCameraPlayer();
    mcp.layoutMode = layout;
    mcp.activeCamera = active;
    mcp.isPlaying = true;
    Object.values(h.players).forEach(p => { p.src = `http://localhost/${p.camera}.mp4`; p.paused = false; });
    return mcp;
}

/**
 * One scenario, run against either implementation. `plan` decides what each feed's decoder is doing
 * for every 100 ms of wall clock; the harness advances the elements, then fires the one real driver
 * this code has — front's `timeupdate`.
 */
function run(scenario, impl, touch) {
    const h = makeSandbox(touch);
    const mcp = build(h, scenario.layout || {});
    mcp.playbackRate = scenario.rate || 1;
    Object.values(h.players).forEach(p => { p._rate = mcp.playbackRate; p.play(); });
    // start every feed on the same media time without costing a seek — that is where a segment load
    // leaves them, and the counter must not attribute it to the corrector
    Object.values(h.players).forEach(p => { p.setTime(100); p.seeking = false; });
    // A real page's `performance.now()` is already tens of seconds in when the first tick fires, and
    // `feedStats.lastCorrection` starts at 0 — so the very first correction of a feed is never
    // actually gated. Zeroing the epoch here made the 2 s cooldown swallow the first two seconds of
    // every scenario, which showed up as an unexplained ~2 s residual on 「one tile paused」.
    h.clock.now = UPTIME_MS;
    Object.values(h.players).forEach(p => { p.stats.writes = 0; p.stats.rateWrites = 0; p.stats.plays = 0; });

    const ticks = scenario.ticks || 30;
    const rate = scenario.rate || 1;
    for (let i = 0; i < ticks; i++) {
        h.clock.now += TICK_MS;
        const dt = TICK_MS / 1000;   // wall clock; the element turns it into media time by its own rate
        Object.entries(h.players).forEach(([camera, p]) => {
            if (scenario.before && scenario.before(h, mcp, camera, p, i)) return;
            p.step(dt);
            // Decode jitter is a wall-clock thing — a frame that arrives late is late no matter what
            // rate the feed is running at — so it has to be multiplied by the rate to become media
            // time. That scaling is the entire reason a 4× review looked like a permanently lagging
            // tile to the old fixed tolerance.
            if (!p.paused && !p.seeking && !p.stalled && scenario.jitter) {
                p.nudge(scenario.jitter(i, camera) * rate);
            }
        });
        h.flush();
        if (impl === 'legacy') legacySync(h, mcp);
        else mcp.syncAllPlayers();
        h.flush();
        if (process.env.R65_TRACE && impl === 'new' && i % 2 === 0) {
            const b = h.players.back;
            console.log(`    t=${h.clock.now} ref=${h.players.front.currentTime.toFixed(2)} back=${b.currentTime.toFixed(2)} paused=${b.paused} rate=${b._rate} st=${JSON.stringify(mcp.feedStats.back)}`);
        }
    }

    const clock = mcp.clockTime();
    const rows = Object.entries(h.players).map(([camera, p]) => {
        const st = mcp.feedStats[camera] || {};
        return {
            cam: camera,
            writes: p.stats.writes,
            rateWrites: p.stats.rateWrites,
            plays: p.stats.plays,
            drift: +(clock - p.currentTime).toFixed(2),
            jumps: st.jumps || 0, glides: st.glides || 0, corrections: st.corrections || 0,
        };
    });
    return { seconds: (ticks * TICK_MS) / 1000, writes: rows.reduce((n, r) => n + r.writes, 0), rows };
}

const SCENARIOS = {
    // 1. The reference is the feed that ran out of data right after a scrub, and it never said so by
    //    advancing again. Every other tile is healthy.
    'ref stalled after scrub': {
        rate: 1, jitter: noise(0.02), ticks: 30,
        before: (h, mcp, cam, p, i) => {
            if (cam !== 'front') return false;
            if (i === 3) { p.stalled = true; h.players.front.dispatchEvent2('waiting'); }
            p.step(0);
            return true;
        },
    },
    // 2. Healthy 4× review with the same wall-clock jitter as scenario 3 — which is exactly what the
    //    old fixed 0.35 s tolerance could not tell apart from a lagging tile.
    '4x review, jitter': { rate: 4, jitter: noise(0.02), ticks: 30 },
    // 3. Same jitter at 1×.
    '1x, jitter': { rate: 1, jitter: noise(0.02), ticks: 30 },
    // 4. One tile stopped dead while the app believes it is playing (the R64-1i leftover). It is
    //    stopped once, at the top; whether it moves again is the answer being measured.
    'one tile paused': {
        rate: 1, jitter: noise(0.02), ticks: 30,
        before: (h, mcp, cam, p, i) => {
            if (cam === 'back' && i === 0) p.paused = true;
            return false;
        },
    },
    // 5. A deferred feed that landed at the segment head after a ±10 s jump: 6 s behind everyone.
    '6s behind once': {
        rate: 1, jitter: noise(0), ticks: 100,
        before: (h, mcp, cam, p, i) => {
            if (cam === 'left' && i === 0) { p.setTime(94); return true; }
            return false;
        },
    },
    // 6. Nothing is wrong: all six advance together.
    'all in tolerance': { rate: 1, jitter: noise(0.005), ticks: 30 },
};

const out = {};
for (const [name, scenario] of Object.entries(SCENARIOS)) {
    const legacyTouch = run(scenario, 'legacy', true);
    const newTouch = run(scenario, 'new', true);
    const legacyDesk = run({ ...scenario, }, 'legacy', false);
    const newDesk = run(scenario, 'new', false);
    out[name] = {
        touch: { before: legacyTouch.writes, after: newTouch.writes, rows: newTouch.rows, perSecBefore: +(legacyTouch.writes / legacyTouch.seconds).toFixed(1), perSecAfter: +(newTouch.writes / newTouch.seconds).toFixed(1) },
        desktop: { before: legacyDesk.writes, after: newDesk.writes, same: legacyDesk.writes === newDesk.writes },
    };
    const fmt = r => `${r.cam} w=${r.writes} j=${r.jumps} g=${r.glides} p=${r.plays} d=${r.drift}`;
    console.log(`\n### ${name}  (${scenario.ticks * TICK_MS / 1000}s, rate ${scenario.rate || 1}×)`);
    console.log(`  phone  before ${legacyTouch.writes} seeks → after ${newTouch.writes}   (${out[name].touch.perSecBefore}/s → ${out[name].touch.perSecAfter}/s)`);
    console.log(`  desk   before ${legacyDesk.writes} → after ${newDesk.writes}  ${out[name].desktop.same ? 'UNCHANGED' : '*** CHANGED ***'}`);
    newTouch.rows.forEach(r => console.log(`    ${fmt(r)}`));
}
console.log('\n' + JSON.stringify(out, null, 1));

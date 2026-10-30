// R180 — 「有些视频的缩略图出来的有点慢」. Measured before anything was changed.
// What the measurement found, on the emulator with 60 rows whose `thumb.png` is a 0-byte write:
//   · the placeholder fires `error`, not `load`, and the upgrade to a decoded frame hung off `load`
//     ⇒ those rows never asked for a frame at all (ask=0) and stayed an empty box;
//   · with the drawer open and real clips, queue p50 1.2 s / p95 2.8 s against a decode of
//     p50 1.0 s, with both slots saturated (livePeak 2/2) ⇒ the wait, not the decoder, is most of
//     it, and a row that already had a picture was holding the slot of a row that had none.
// So this suite checks both halves: the dead-placeholder handover, and the tier order.
// Run: CDP_TIMEOUT_MS=90000 node devtools/cdp-eval.mjs --file devtools/r180-verify.js
(async () => {
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });

    const parse = (line) => {
        const out = {};
        line.split(/\s+/).forEach((tok) => {
            const i = tok.indexOf('=');
            if (i > 0) out[tok.slice(0, i)] = tok.slice(i + 1);
        });
        return out;
    };
    // Values arrive as `473/1045`, sometimes with a sample count glued on (`473/1045/n=32`), and a
    // cold ledger says `-/-`. Number('-') is NaN and NaN <= NaN is false, which is how an empty
    // sample list once read as a failed percentile.
    const two = (s) => {
        const m = /^(\d+)\/(\d+)/.exec(s || '');
        return m ? [Number(m[1]), Number(m[2])] : [null, null];
    };
    const sortedOf = (list) => (Array.isArray(list) ? list.slice().sort((a, b) => a - b) : []);

    const line0 = typeof v.describeThumbs === 'function' ? v.describeThumbs() : null;
    check('APP 自带缩略图台账（describeThumbs）', !!line0, line0 ? line0.slice(0, 22) : 'missing');
    if (!line0) return JSON.stringify({ checks, err: 'no ledger' });
    const f0 = parse(line0);
    check('台账字段齐全', ['ask', 'hit', 'dedup', 'ok', 'fail', 'livePeak', 'legs', 'qNow', 'queue',
        'queueU', 'queueN', 'grab', 'native', 'video', 'ph', 'ph1', 'phFail', 'card', 'first', 'screen']
        .every((k) => k in f0), Object.keys(f0).join(','));

    const list = document.getElementById('fileList');
    check('列表已渲染', !!list && list.querySelectorAll('.video-card').length > 0,
        list ? `cards=${list.querySelectorAll('.video-card').length}` : 'no #fileList');
    if (!list) return JSON.stringify({ checks });

    // Precondition the probe owns, not one it assumes: the observer only answers rows that are
    // actually on screen, so a collapsed drawer would turn 「没有请求」 into a false red.
    if (typeof v.toggleSidebar === 'function') v.toggleSidebar(true);
    await wait(700);
    const left = Math.round(list.getBoundingClientRect().left);
    check('前置：列表面板在屏幕上（抽屉已开）', left >= -1, `#fileList left=${left}px`);
    if (left < -1) return JSON.stringify({ checks });

    const hasFrame = (box) => {
        const img = box.querySelector('img');
        return !!img && /^data:image\//.test(img.currentSrc || img.src || '') && img.naturalWidth > 0;
    };
    const tally = () => {
        const boxes = [...list.querySelectorAll('.video-card .video-thumbnail')];
        const painted = (b) => {
            const img = b.querySelector('img');
            return !!img && img.complete && img.naturalWidth > 0;
        };
        return {
            rows: boxes.length,
            frame: boxes.filter(hasFrame).length,
            photo: boxes.filter((b) => painted(b) && !hasFrame(b)).length,
            glyph: boxes.filter((b) => b.querySelector('.no-thumb')).length,
            // an <img> that finished with nothing to show: the dead placeholder this round is about
            dead: boxes.filter((b) => {
                const img = b.querySelector('img');
                return !!img && img.complete && img.naturalWidth === 0;
            }).length,
            wait: boxes.filter((b) => b.classList.contains('list-pending')).length,
            refused: boxes.filter((b) => b.dataset.frameRefused).length,
            urgent: boxes.filter((b) => b.dataset.frameUrgent === '1').length,
        };
    };
    const t0 = tally();
    const before = parse(v.describeThumbs());

    check('占位图读不出像素的行不留空盒',
        t0.rows === 0 || t0.frame + t0.photo + t0.glyph === t0.rows,
        `rows=${t0.rows} 真帧=${t0.frame} 车拍图=${t0.photo} 图腾=${t0.glyph} 空盒=${t0.rows - t0.frame - t0.photo - t0.glyph}`);
    check('这些行确实交给了取帧（不是只画个图腾）',
        t0.dead === 0 || t0.wait + t0.frame + t0.glyph > 0,
        `空盒=${t0.dead} 已排队=${t0.wait}（其中无图行=${t0.urgent}）`);

    // A row whose clip also refuses must end on the glyph, not on a box that keeps promising a
    // picture. The 0-byte fixtures give this for free.
    await wait(2500);
    const t1 = tally();
    check('取帧也失败的行落回图腾（不再挂「还在等」）',
        t1.refused === 0 || t1.glyph > 0,
        `已放弃=${t1.refused} 图腾=${t1.glyph} 仍等=${t1.wait}`);

    // One sample per row: the guard lives on the row element, so ask a fresh box twice and it must
    // add exactly one sample. A real row can't be used for this — the interesting ones have already
    // been counted once, which is the very thing being asserted.
    const T0 = (typeof ThumbPerf !== 'undefined') ? ThumbPerf : null;
    let guardOk = false;
    let guardDetail = '台账不可见';
    if (T0) {
        const wrap = document.createElement('div');
        wrap.className = 'video-card';
        wrap.dataset.t0 = String(T0.t0());
        const box = document.createElement('div');
        box.className = 'video-thumbnail';
        wrap.appendChild(box);
        const n0 = T0.firstMs.length;
        T0.first(box);
        const n1 = T0.firstMs.length;
        T0.first(box);
        const n2 = T0.firstMs.length;
        guardOk = n1 === n0 + 1 && n2 === n1;
        guardDetail = `首问 +${n1 - n0}，同一行再问 +${n2 - n1}`;
    }
    check('首张图每行只算一次', guardOk, guardDetail);

    // Walk the list so rows that have nothing on screen yet actually enter the observer's view:
    // the drawer is ~454 px tall and a row is ~74 px, so one screen is ~8 rows and the rest of the
    // 60 have not asked for anything yet. Without this the urgent tier has no samples at all.
    const steps = 6;
    for (let i = 1; i <= steps; i += 1) {
        list.scrollTop = Math.round(list.clientHeight * i * 0.9);
        await wait(900);
    }
    await wait(2500);

    // ── tier order: the actual claim of this round ────────────────────────────────────────────
    // Two slow decodes occupy both slots, then a normal ask, then an urgent one. FIFO would land the
    // urgent one second; the tiers must land it first. Ordering is the assertion, not duration, so
    // this says the same thing on a slow handset and on the emulator.
    // Paths come from the events, never from the boxes: the observer deletes `data-frame-path` the
    // moment it asks, and the rows worth testing are exactly the ones that already asked.
    let tier = null;
    const events = v.lastFilteredEvents || v.eventGroups || [];
    const byId = new Map(events.map((e) => [e.eventId, e]));
    const pathOf = (card) => {
        const e = byId.get(card.dataset.eventId);
        const files = e && e.segments && e.segments[0] && e.segments[0].files;
        const file = files && (files.front || Object.values(files)[0]);
        return file && file.path ? file.path : null;
    };
    const cards = [...list.querySelectorAll('.video-card')];
    // A row that already shows a decoded frame proves its clip actually decodes — that is the only
    // honest way to pick a job slow enough to hold a slot. Any other row fails in tens of ms and
    // the two tiers would finish inside the same millisecond, which proves nothing.
    const slow = [...new Set(cards.filter((c) => hasFrame(c.querySelector('.video-thumbnail')))
        .map(pathOf))].filter(Boolean).slice(0, 1);
    const dead = [...new Set(cards.filter((c) => {
        const box = c.querySelector('.video-thumbnail');
        return box && box.dataset.frameRefused;
    }).map(pathOf))].filter(Boolean).slice(0, 2);
    if (typeof FrameFetcher !== 'undefined' && dead.length >= 2) {
        // No timing race: freeze dispatch, queue a normal ask then an urgent one, then let it
        // drain and read the order the jobs actually left in. On the old single FIFO array this
        // reads ['N','U'], so the criterion goes red on exactly the thing it is meant to catch.
        const savedMax = FrameFetcher.MAX_LIVE;
        const seen = [];
        const realGrab = FrameFetcher.grab;
        // Seconds no earlier pass can have cached: a key that already answered `null` is a cache
        // hit, and a hit resolves in 0 ms however full the queue is.
        const S = 900 + (Date.now() % 97);
        let jobU = null;
        let jobN = null;
        try {
            FrameFetcher.grab = function (path, seconds, width, done, job) {
                // Identity, not a timestamp: both jobs can be dispatched inside the same synchronous
                // loop, where performance.now() reads the same value and proves nothing.
                seen.push(job === jobU ? 'U' : job === jobN ? 'N' : '-');
                return realGrab.call(this, path, seconds, width, done, job);
            };
            FrameFetcher.MAX_LIVE = 0;
            FrameFetcher.get(dead[0], S, 320, false);
            FrameFetcher.get(dead[1], S + 1, 320, true);
            jobN = FrameFetcher.waitingNormal[FrameFetcher.waitingNormal.length - 1];
            jobU = FrameFetcher.waitingUrgent[FrameFetcher.waitingUrgent.length - 1];
            const queued = { u: FrameFetcher.waitingUrgent.length, n: FrameFetcher.waitingNormal.length };
            FrameFetcher.MAX_LIVE = savedMax;
            for (let i = 0; i < 80 && !(seen.includes('U') && seen.includes('N')); i += 1) {
                FrameFetcher.drain();
                if (!(seen.includes('U') && seen.includes('N'))) await wait(100);
            }
            tier = { seen: seen.filter((t) => t !== '-'), queued };
        } finally {
            FrameFetcher.grab = realGrab;
            FrameFetcher.MAX_LIVE = savedMax;
            FrameFetcher.drain();
        }
    } else {
        tier = { seen: [], why: `放弃过的行=${dead.length}` };
    }
    check('队满时「这行没图」排在「把已有图变清楚」前面',
        tier.seen.length >= 2 && tier.seen[0] === 'U' && tier.seen[1] === 'N',
        JSON.stringify(tier));

    // ── timing, now that work has actually happened ───────────────────────────────────────────
    const a = parse(v.describeThumbs());
    const [q50, q95] = two(a.queue);
    const [g50, g95] = two(a.grab);
    const [c50, c95] = two(a.card);
    const [n50, n95] = two(a.native);
    check('排队与解码分开有数（这才分得清该加并发还是该怪解码）',
        q95 !== null && g95 !== null,
        `queue=${a.queue} grab=${a.grab} native=${a.native} video=${a.video} legs=${a.legs} ok=${a.ok} fail=${a.fail}`);
    check('p50 不高于 p95',
        [[q50, q95], [g50, g95], [c50, c95], [n50, n95]].every(([x, y]) => x === null || x <= y),
        `queue ${a.queue} grab ${a.grab} card ${a.card} native ${a.native}`);
    const [uq50, uq95] = two(a.queueU);
    const [nq50, nq95] = two(a.queueN);
    check('分档排队都有样本，且紧急档不比常规档久',
        (uq95 === null || nq95 === null || uq95 <= nq95) && (uq50 !== null || nq50 !== null),
        `queueU=${a.queueU} queueN=${a.queueN} first=${a.first} ph=${a.ph} card=${a.card}`);
    const [lp, cap] = (a.livePeak || '/').split('/').map(Number);
    check('同时在飞不超过上限', lp <= cap, `peak=${lp}/${cap} qNow=${a.qNow}`);

    const asked = Number(a.ask) - Number(before.ask);
    const hitMore = Number(a.hit) - Number(before.hit);
    check('滚动/筛选真的触发送帧请求', asked + hitMore > 0, `ask+=${asked} hit+=${hitMore}`);
    const T = (typeof ThumbPerf !== 'undefined') ? ThumbPerf : null;
    check('台账在真实取帧中累积', !!T && T.grabMs.length > 0,
        T ? `queue=${T.queueMs.length} grab=${T.grabMs.length} card=${T.cardMs.length} first=${T.firstMs.length}` : '台账不可见');

    if (typeof FrameFetcher !== 'undefined' && FrameFetcher.cache.size) {
        const k = [...FrameFetcher.cache.keys()].find((key) => key.endsWith('x320'));
        const at = k ? k.lastIndexOf('@') : -1;
        if (at > 0) {
            const path = k.slice(0, at);
            const tail = k.slice(at + 1);
            const seconds = Number(parseInt(tail, 10));
            const width = Number(tail.split('x')[1]);
            const a0 = parse(v.describeThumbs());
            await FrameFetcher.get(path, seconds, width);
            const a1 = parse(v.describeThumbs());
            check('同 key 再问走缓存（不再进解码）',
                Number(a1.hit) > Number(a0.hit) && Number(a1.ask) === Number(a0.ask),
                `hit ${a0.hit}→${a1.hit} ask ${a0.ask}→${a1.ask}`);
        } else {
            check('同 key 再问走缓存（不再进解码）', false, '缓存里没有 x320 样本可复问');
        }
    } else {
        check('同 key 再问走缓存（不再进解码）', false, '缓存为空');
    }

    check('占位图失败有计数', Number(a.phFail) > 0, `phFail=${a.phFail} 空盒=${t1.dead}`);
    const settled = tally();
    check('停住后没有空盒', settled.dead === 0,
        `rows=${settled.rows} 真帧=${settled.frame} 车拍图=${settled.photo} 图腾=${settled.glyph} 空盒=${settled.dead} 仍等=${settled.wait} 已放弃=${settled.refused}`);

    return JSON.stringify({
        checks,
        ledgerStart: line0,
        ledgerEnd: v.describeThumbs(),
        tally: { t0, t1, settled },
        tier,
        samples: T ? {
            uQueue: sortedOf(T.uQueueMs), nQueue: sortedOf(T.nQueueMs),
            grab: sortedOf(T.grabMs), native: sortedOf(T.nativeMs), video: sortedOf(T.videoMs),
            first: sortedOf(T.firstMs), ph: sortedOf(T.phMs), card: sortedOf(T.cardMs),
            cache: FrameFetcher ? FrameFetcher.cache.size : null,
        } : null,
        view: `${Math.round(innerWidth)}x${Math.round(innerHeight)}`,
        failing: checks.filter((c) => !c.ok),
    });
})();

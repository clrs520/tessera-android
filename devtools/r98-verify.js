// R98 batch-3 acceptance: 事件卡体积、A-B 循环、删除撤销、导出选择记忆.
// Every judgement is taken from what a person would see or hit, per the standing rules: read the
// rendered box, not the JS flag (R42), and check a control is on-screen and thumb-sized rather
// than merely present (R90/R96/R97).
//
// Deliberately NOT destructive here: the undo half arms a real delete and then cancels it, so no
// clip is unlinked by this probe. The flush half lives in r98-flush.js, run separately, because it
// costs a fixture event.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail)
        .push(name + (detail === undefined ? '' : ' = ' + detail));

    const c = v.videoControls;
    const cards = () => [...document.querySelectorAll('.video-card')];
    const subText = () => cards().map(n => (n.querySelector('.video-sub') || {}).textContent || '');

    // Everything below reads a live list; a cold start has none of it yet (R93: an `am start` leaves
    // the process without a scan for 20-25 s, and a probe that assumes one measures nothing).
    for (let i = 0; i < 40 && !(v.eventGroups || []).length; i += 1) await sleep(500);
    const opener = v.eventGroups.find(e => String(e.eventId).includes('RecentClips')) || v.eventGroups[0];
    await v.playEvent(opener.eventId);
    for (let i = 0; i < 40 && !(c.totalDuration > 1); i += 1) await sleep(250);

    // ---- A: the card says how big the clip is, and the number came from the disk ----
    ok('A the scan carried a byte length for every file',
        v.allFiles.length > 0 && v.allFiles.every(f => Number.isFinite(f.size)),
        `files=${v.allFiles.length} sample=${v.allFiles[0] && v.allFiles[0].size}`);
    ok('A every event total is a sum of its own clips',
        v.eventGroups.every(e => Number.isFinite(e.bytes) && e.bytes >= 0),
        `n=${v.eventGroups.length} first=${v.eventGroups[0] && v.eventGroups[0].bytes}`);
    const subs = subText();
    ok('A the rendered sub line reads 类型 · 体积 (no dangling separator)',
        subs.length > 0 && subs.every(t => /·\s*\d+(\.\d+)?\s*(MB|GB|KB)$/.test(t.trim())),
        JSON.stringify(subs.slice(0, 3)));
    const shown = subs[0] || '';
    const first = v.eventGroups[0] || {};
    ok('A what the card shows is what the event holds',
        shown.includes(window.formatBytes(first.bytes)), `${shown} vs ${window.formatBytes(first.bytes)}`);

    // ---- B: A-B loop ----
    const btn = document.getElementById('loopABBtn');
    ok('B the ⋮ panel has the loop row', !!btn && btn.classList.contains('phone-only-btn'));
    ok('B its label is the localized off-state and it is not pressed',
        !!btn && /A-B 循环：关/.test(btn.querySelector('.btn-text').textContent)
        && btn.getAttribute('aria-pressed') === 'false' && !btn.classList.contains('is-on'),
        btn && btn.getAttribute('aria-label'));

    // No range yet → it must refuse, not turn on.
    const savedStart = c.clipStartTime, savedEnd = c.clipEndTime;
    c.clipStartTime = null; c.clipEndTime = null;
    v.loopAB = false;
    v.toggleLoopAB();
    ok('B with no clip range it refuses and says why',
        v.loopAB === false && /还没有设定片段区间/.test((document.querySelector('.toast') || {}).textContent || ''),
        (document.querySelector('.toast') || {}).textContent);
    v.loopAB = false;

    // Now a real range inside the running segment, and watch it wrap. Measured here: this AVD advances
    // the clip clock at 0.44× real time (4.45 clip-s in 10.1 wall-s), so the range is short and the
    // window long — on a 2.5 s range it wrapped once in 15 s and read as a stall that is not one.
    const now = v.continuousPlayer.getCurrentTime();
    // 区间不能就地取：这一场跑到 513s 时只剩 1.9s 片长，「出点后最多再走 0.6s」这条判据量到的其实是
    // 「媒体放完了」。所以把区间挪到事件中段，并且给判据加上那个物理上界（min(b+0.6, 事件总长)）——
    // 两条一起做，判据既不会被片尾蒙过去，也不会在正常位置放水。
    const total = +(v.continuousPlayer.totalDuration || 0);
    // 区间必须**就地**取，且播放头要落在区间里面：把区间挪到事件中段而播放头还在原地，循环永远不会
    // 越界（这一版就这么把 wraps 量成 0）。所以要么就地，要么先 seek 过去再就地 —— 二选一，不能只挪区间。
    let armAt = now;
    if (total > 8 && now > total - 6) {
        armAt = total * 0.4;
        try { await v.continuousPlayer.applySeek(armAt); await sleep(900); armAt = v.continuousPlayer.getCurrentTime(); } catch (e) { armAt = now; }
    }
    c.clipStartTime = Math.max(0, armAt);
    c.clipEndTime = Math.max(0, armAt) + 0.8;
    c.updateClipSelection();
    await sleep(60);
    const a = c.clipStartTime, b = c.clipEndTime;
    // The verb is on the transport, not on the viewer — and this branch only runs when the session
    // happens to be paused, so a wrong receiver here stays invisible until the one run that needs it.
    if (!c.isPlaying && typeof c.togglePlayPause === 'function') c.togglePlayPause();
    await sleep(300);
    ok('B playback is actually running before the loop is armed', c.isPlaying, `playing=${c.isPlaying}`);
    v.toggleLoopAB();
    ok('B arming it flips the row on',
        v.loopAB === true && btn.getAttribute('aria-pressed') === 'true' && btn.classList.contains('is-on'),
        btn.querySelector('.btn-text').textContent);

    let last = v.continuousPlayer.getCurrentTime(), seen = last, wraps = 0;
    // The window is a wall-clock cap, not a clip-time expectation: this AVD ran the clock anywhere
    // between 0.44× (measured) and slower depending on host load, and a fixed 30 s window failed the
    // same build twice out of three. It breaks as soon as the third wrap is in.
    const wall0 = Date.now();
    while (wraps < 3 && (Date.now() - wall0) < 60000) {
        await sleep(200);
        const t = v.continuousPlayer.getCurrentTime();
        if (t + 0.4 < last) wraps++;
        seen = Math.max(seen, t);
        last = t;
    }
    const wallS = (Date.now() - wall0) / 1000;
    ok('B it keeps returning to the in point, not just once',
        wraps >= 3, `wraps=${wraps} in=${wallS.toFixed(0)}s rate=${((b - a) * wraps / wallS).toFixed(2)}× a=${a.toFixed(1)} b=${b.toFixed(1)}`);
    const driftCap = Math.min(b + 0.6, (total > 0 ? total + 0.05 : Infinity));
    ok('B it never drifts far past the out point', seen <= driftCap,
        `max=${seen.toFixed(2)} b=${b.toFixed(2)} 允许到 ${driftCap.toFixed(2)}（事件总长 ${total.toFixed(1)}）`);
    ok('B no seek is left in flight once the watch ended', c.loopABSeeking === false, c.loopABSeeking);

    // Release test: park the clock just inside the range first. Turning the loop off straight after a
    // wrap measures the climb from the in point, which on this AVD took longer than any fixed window.
    v.toggleLoopAB();
    ok('B switching it off releases the range',
        v.loopAB === false && btn.getAttribute('aria-pressed') === 'false'
        && !btn.classList.contains('is-on'), btn.querySelector('.btn-text').textContent);
    await v.continuousPlayer.seekToTime(b - 0.15);
    await sleep(500);
    let past = 0, pastS = 0;
    for (let i = 0; i < 150 && !past; i++) {
        await sleep(200);
        pastS = ((i + 1) * 200 / 1000).toFixed(1);
        if (v.continuousPlayer.getCurrentTime() > b) past = 1;
    }
    ok('B off really means the playhead keeps going', past === 1,
        `t=${v.continuousPlayer.getCurrentTime().toFixed(2)} b=${b.toFixed(2)} after=${pastS}s`);
    c.clipStartTime = savedStart; c.clipEndTime = savedEnd;
    c.updateClipSelection();

    // ---- C: the undo bar is a thumb-sized thing at the bottom, not a top-of-screen announcement ----
    const before = document.querySelectorAll('.toast').length;
    v.showToast('已删除 6 个文件', 'success', 6000, { label: '撤销', onClick: () => {} });
    await sleep(120);
    const pill = [...document.querySelectorAll('.toast')].slice(before)[0];
    const action = pill && pill.querySelector('.toast-action');
    const pr = pill && pill.getBoundingClientRect();
    const ar = action && action.getBoundingClientRect();
    ok('C the action pill really is the one with a button',
        !!pill && pill.classList.contains('has-action') && !!action && pill.textContent.includes('撤销'),
        pill && pill.className);
    ok('C it is hung on <body>, and an ordinary toast still goes in the top column',
        pill.parentElement === document.body && pill.getAttribute('role') === 'status',
        pill.parentElement && pill.parentElement.className);
    v.showToast('普通提示', 'info', 1200);
    const plain = [...document.querySelectorAll('.toast-container .toast')].pop();
    ok('C the column still owns toasts without a button',
        plain.parentElement === document.querySelector('.toast-container')
        && !plain.classList.contains('has-action'), plain.parentElement.className);
    ok('C it sits in the lower half of the screen',
        !!pr && pr.top > innerHeight * 0.6, `top=${pr && pr.top.toFixed(0)} of ${innerHeight}`);
    ok('C the pill is on-screen and centred, not clipped',
        !!pr && pr.left >= 0 && pr.right <= innerWidth + 0.5 && pr.width > 200,
        pr && `${pr.left.toFixed(0)}..${pr.right.toFixed(0)}`);
    // Boxes snap to whole device pixels, so at dpr 2.475 (the Xiaomi 14's CSS-436 metric) a 40px
    // target measures 39.96 and this line lies. The standard is 40 *device* px, not 40 CSS px.
    const tolPx = 0.5 / devicePixelRatio;
    ok('C the 撤销 target is 40dp or better',
        !!ar && ar.height >= 40 - tolPx && ar.width >= 44 - tolPx,
        ar && `${ar.width.toFixed(2)}x${ar.height.toFixed(2)} @dpr${devicePixelRatio}`);
    const cs = action && getComputedStyle(action);
    ok('C its text colour is the light end of the blue ramp, and the pill stayed dark',
        !!cs && cs.color === 'rgb(125, 196, 255)'
        && getComputedStyle(pill).backgroundColor === 'rgba(30, 30, 40, 0.95)', cs && cs.color);
    // The bar is only showing with the drawer closed, and each state needs a pill that has finished
    // its entry slide: the last 20 px of the pill's position comes from `transform`, so a read before
    // it settles compares a mid-slide pill against a settled bar (measured: pill 833 against bar
    // 823.5 — a 9.5 px "overlap" that is nothing but animation).
    const barBox = () => {
        const bar = document.querySelector('.phone-action-bar');
        const s = getComputedStyle(bar);
        return { top: +bar.getBoundingClientRect().top.toFixed(1),
            visible: s.visibility === 'visible' && s.opacity !== '0' };
    };
    const freshPill = async () => {
        document.querySelectorAll('body > .toast.has-action').forEach(n => n.remove());
        const n = document.querySelectorAll('.toast').length;
        v.showToast('已删除 9 个文件', 'success', 9000, { label: '撤销', onClick: () => {} });
        const node = [...document.querySelectorAll('.toast')].slice(n).pop();
        let ty = 20;
        for (let i = 0; i < 40 && !(i > 4 && Math.abs(ty) < 0.01); i++) {
            await sleep(100);
            const m = getComputedStyle(node).transform.match(/,\s*([-\d.]+)\s*\)$/);
            ty = m ? Number(m[1]) : 0;
        }
        return { node, bottom: +node.getBoundingClientRect().bottom.toFixed(1) };
    };
    const inset = (() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;bottom:0;height:var(--safe-bottom);visibility:hidden';
        document.body.appendChild(probe);
        const h = probe.getBoundingClientRect().height;
        probe.remove();
        return h;
    })();

    document.getElementById('tabLayoutBtn').click();     // the real way to reach "bar is showing"
    await sleep(800);
    const closed = await freshPill();
    const barClosed = barBox();
    ok('C with the bottom bar showing, the pill sits above it',
        barClosed.visible && closed.bottom <= barClosed.top,
        `pillBottom=${closed.bottom} barTop=${barClosed.top} clearance=${(barClosed.top - closed.bottom).toFixed(1)}`);
    ok('C it sits in the lower half of the screen',
        closed.bottom > innerHeight * 0.6, `bottom=${closed.bottom} of ${innerHeight}`);
    closed.node.remove();

    document.getElementById('tabListBtn').click();        // back to the list
    await sleep(800);
    const open = await freshPill();
    const barOpen = barBox();
    ok('C with the drawer open it keeps its 16px over whatever the gesture strip measures',
        !barOpen.visible && Math.abs((innerHeight - open.bottom) - (16 + inset)) <= 1.5,
        `gap=${(innerHeight - open.bottom).toFixed(1)} inset=${inset.toFixed(1)}`);
    open.node.remove();

    // ---- C2: one real delete, cancelled ----
    const target = v.eventGroups[v.eventGroups.length - 1];
    const targets = v.eventDeleteTargets(target);
    const groupsBefore = v.eventGroups.length, filesBefore = v.allFiles.length;
    v.pendingDelete = { event: target, targets };
    await v.confirmDeleteEvent();
    await sleep(150);
    ok('C2 confirming drops the card at once',
        v.eventGroups.length === groupsBefore - 1 && !v.eventGroups.some(e => e.eventId === target.eventId),
        `${groupsBefore} -> ${v.eventGroups.length}`);
    ok('C2 nothing has been unlinked yet — the job is merely armed',
        v.pendingDeleteUndo && v.pendingDeleteUndo.event.eventId === target.eventId
        && v.pendingDeleteUndo.targets.length === targets.length,
        v.pendingDeleteUndo && `targets=${v.pendingDeleteUndo.targets.length} index=${v.pendingDeleteUndo.index}`);
    const undoPill = [...document.querySelectorAll('.toast.has-action')].pop();
    ok('C2 the bar offering the way back is on screen',
        !!undoPill && /撤销/.test(undoPill.textContent), undoPill && undoPill.textContent);
    v.undoDelete(v.pendingDeleteUndo);
    await sleep(150);
    ok('C2 撤销 puts the card back',
        v.eventGroups.some(e => e.eventId === target.eventId)
        && v.eventGroups.length === groupsBefore, `${groupsBefore} -> ${v.eventGroups.length}`);
    ok('C2 and the fuse is out', v.pendingDeleteUndo === null, String(v.pendingDeleteUndo));
    ok('C2 no file object is lost or doubled',
        v.allFiles.length === filesBefore
        && new Set(v.allFiles.map(f => f.path)).size === v.allFiles.length,
        `${filesBefore} -> ${v.allFiles.length}`);
    ok('C2 the restored entry is the same object, still in its old slot',
        v.eventGroups[v.eventGroups.length - 1] === target, 'last=' + (v.eventGroups[v.eventGroups.length - 1] === target));
    // A stale 撤销 from the dismissed pill must not resurrect anything.
    v.undoDelete({ event: target, removedFiles: [], targets: [], index: 0 });
    ok('C2 a late undo on an already-flushed job does nothing',
        v.allFiles.length === filesBefore, `${filesBefore} -> ${v.allFiles.length}`);
    await sleep(6500);
    ok('C2 six seconds after a cancelled delete, nothing went away anyway',
        v.eventGroups.length === groupsBefore && v.allFiles.length === filesBefore,
        `${v.eventGroups.length}/${v.allFiles.length}`);

    // ---- D: the two export choices that used to reset every time ----
    await v.showPhoneExportModal();
    await sleep(400);
    const pe = v.peSelection;
    const chips = [...document.querySelectorAll('#peCameraChips [data-camera]')];
    ok('D the camera row is rendered', chips.length >= 2, `chips=${chips.length}`);
    localStorage.removeItem('tdashcam.exportChoices');
    // One chip on, not the lot: clearing every camera makes the panel re-default to 前视, and then the
    // store and the live selection disagree for a reason that has nothing to do with persistence.
    const flip = chips.find(chip => !chip.classList.contains('on')) || chips[0];
    flip.click();
    const sizeChips = [...document.querySelectorAll('#peSizeChips [data-size]')];
    sizeChips.find(chip => chip.dataset.size === '1080').click();
    await sleep(120);
    const stored = JSON.parse(localStorage.getItem('tdashcam.exportChoices') || '{}');
    ok('D picking chips writes the choice out',
        Array.isArray(stored.cameras) && stored.size === '1080', JSON.stringify(stored));
    const read = v.readExportChoices();
    ok('D and reading it back gives the same set',
        read.size === '1080' && JSON.stringify(read.cameras) === JSON.stringify(pe.cameras),
        JSON.stringify(read));
    // A corrupt store must not open the page on a bad foot.
    localStorage.setItem('tdashcam.exportChoices', '{"cameras":"nope","size":"9999"}');
    const sane = v.readExportChoices();
    ok('D garbage in storage falls back to the defaults',
        JSON.stringify(sane.cameras) === '[]' && sane.size === '720', JSON.stringify(sane));
    localStorage.setItem('tdashcam.exportChoices', 'not json');
    ok('D and unparseable storage does too',
        v.readExportChoices().size === '720');
    localStorage.removeItem('tdashcam.exportChoices');
    v.hidePhoneExportModal();

    out.summary = `pass=${out.pass.length} fail=${out.fail.length}`;
    return out;
})()

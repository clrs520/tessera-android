// R96 batch 1 acceptance. Five changes, each judged by what the user would see rather than by whether
// a function exists. Run against the emulator; every claim here was false before the corresponding
// edit, and the desktop half of C/E is checked through the CSSOM because a phone shell cannot
// un-become a phone.
(async () => {
    const v = window.viewer;
    const m = v.multiCameraPlayer;
    const vc = v.videoControls;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (name, cond, detail) => (cond ? out.pass : out.fail).push(name + (detail === undefined ? '' : ' = ' + detail));
    const shown = id => getComputedStyle(document.getElementById(id)).display;

    // ---- A: the export page says how big the file will be ----
    // An event first: `phoneExportPlan()` answers 「无元数据」 with no `currentEvent`, which is the same
    // trap `r93-verify` fell into. Everything below depends on there being something to export.
    const ev = (v.eventGroups || []).find(e => String(e.eventId).includes('RecentClips')) || (v.eventGroups || [])[0];
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(v.videoControls.totalDuration > 1); i += 1) await sleep(250);
    await v.showPhoneExportModal();
    await sleep(600);
    const plan = v.phoneExportPlan();
    ok('A plan exists for the live event', !plan.error, plan.error || `${plan.width}x${plan.height}`);
    const summary = document.getElementById('peSummary').textContent;
    const est = v.peExportSizeEstimate(plan);
    ok('A summary carries the estimate', /约\s*\d/.test(summary) && /\d+(\.\d+)?\s*(KB|MB|GB)/.test(summary), summary);
    ok('A the estimate is the encoder formula, not a guess',
        est > 0 && Math.abs(est - v.peExportSizeEstimate(v.phoneExportPlan())) < 1, `${est} bytes`);
    await sleep(1200);
    const withFree = document.getElementById('peSummary').textContent;
    ok('A the volume answer lands on the same row', /剩\s*\d/.test(withFree), withFree);
    // A smaller preset must produce a smaller number, or the row is decoration.
    // Pin the starting point first: R98 made the chosen resolution persist, so whatever the previous
    // suite left selected is what `est` would otherwise be measured against — and when that was already
    // 480, this read `937500 -> 937500` and called the row decoration. (Cross-suite state, R95 lesson.)
    document.querySelector('#peSizeChips [data-size="source"]')?.click();
    await sleep(300);
    const biggest = v.peExportSizeEstimate(v.phoneExportPlan());
    document.querySelector('#peSizeChips [data-size="480"]')?.click();
    await sleep(300);
    const small = v.peExportSizeEstimate(v.phoneExportPlan());
    ok('A changing the preset changes the estimate', small < biggest, `${biggest} -> ${small}`);
    document.querySelector('#peSizeChips [data-size="720"]')?.click();
    await sleep(300);
    const named = v.phoneExportPlan();
    ok('A the file name the estimate quotes is the one the export writes',
        !named.error && v.peOutPath(named).endsWith('.mp4') && v.peOutPath(named).includes(`${named.width}x`),
        named.error || v.peOutPath(named).split('/').pop());
    v.hidePhoneExportModal?.();
    await sleep(400);

    // ---- B: 只看触发 ----
    const btn = document.getElementById('triggerFilterBtn');
    ok('B the row exists with a pressed state', !!btn && btn.getAttribute('aria-pressed') === 'false', btn && btn.textContent.trim());
    const before = v.lastFilteredEvents.length;
    btn.click();
    await sleep(300);
    ok('B it filters, and the label follows', v.triggerOnly === true
        && v.lastFilteredEvents.length <= before
        && btn.getAttribute('aria-pressed') === 'true' && /开/.test(btn.textContent),
        `${before} -> ${v.lastFilteredEvents.length}`);
    const kept = v.lastFilteredEvents.every(e => !!v.triggerViewsFor(e));
    ok('B every kept row really has a trigger', kept, `${v.lastFilteredEvents.length} kept`);
    // Without this the check above is vacuous: an event set where nothing carries a reason makes
    // "everything kept has a reason" true while filtering zero rows.
    ok('B this device has something to filter',
        v.eventGroups.some(e => !!v.triggerViewsFor(e)),
        `${v.eventGroups.filter(e => !!v.triggerViewsFor(e)).length}/${v.eventGroups.length} carry a reason`);
    btn.click();
    await sleep(300);
    ok('B it un-filters', v.triggerOnly === false && v.lastFilteredEvents.length === before, `${v.lastFilteredEvents.length}`);
    v.starredOnly = true; v.triggerOnly = true;
    v.dom.eventSearch.value = 'zzz-no-such-thing';
    v.filterAndRender();
    ok('B 清除筛选 takes it along with the rest',
        v.hasActiveFilters() === true, 'armed');
    v.clearFilters();
    await sleep(200);
    ok('B cleared', v.hasActiveFilters() === false && v.triggerOnly === false
        && /关/.test(btn.textContent) && btn.getAttribute('aria-pressed') === 'false');

    // ---- C: the four new buttons ----
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 40 && !(vc.totalDuration > 1); i += 1) await sleep(250);
    const firstId = v.currentEvent.eventId;
    document.getElementById('nextEventBtn').click();
    await sleep(1500);
    ok('C a real press changes the event', v.currentEvent.eventId !== firstId,
        `${firstId.split('/').pop()} -> ${(v.currentEvent.eventId || '').split('/').pop()}`);
    document.getElementById('prevEventBtn').click();
    await sleep(1500);
    ok('C and back again', v.currentEvent.eventId === firstId, (v.currentEvent.eventId || '').split('/').pop());
    /* The two event presses just reloaded the clip, and a reload clears every `src` for a moment. In
       that window `playAll()`, `pauseAll()` and a press of the button all find elements that are
       already paused, so no `pause` event fires and no state lands — the R64 family, and the reason
       this check failed twice with `area="player-area legacy-view"`. Wait until the picture is
       genuinely running, then press the way a person does. */
    for (let i = 0; i < 30 && (!m.players.front || !m.isPlaying || m.players.front.paused); i += 1) await sleep(200);
    ok('C event steppers show while playing', shown('prevEventBtn') !== 'none' && shown('nextEventBtn') !== 'none',
        `${shown('prevEventBtn')}/${shown('nextEventBtn')}`);
    ok('C frame steppers hide while playing', shown('prevFrameBtn') === 'none',
        `${shown('prevFrameBtn')} playing=${m.isPlaying} el=${m.players.front ? (m.players.front.paused ? 'paused' : 'running') : 'gone'}`);
    /* The row is a fixed lane on a 412 px phone and it had nothing to spare before this round. Five
       steppers overflowed it to 451 px and pushed 剪辑/倍速 past the screen edge while paused, so the
       row's own width is part of the acceptance, in both states. */
    const lane = () => document.querySelector('.controls-section');
    const pushedOut = () => ['fullscreenBtn', 'clipBtn', 'speedBtn']
        .filter(id => {
            const n = document.getElementById(id);
            return n && getComputedStyle(n).display !== 'none' && n.getBoundingClientRect().right > innerWidth + 1;
        });
    ok('C playing: the row fits and the right-hand controls stay on screen',
        lane().scrollWidth <= lane().clientWidth + 1 && pushedOut().length === 0,
        `${lane().scrollWidth}/${lane().clientWidth} out=${pushedOut().join(',') || 'none'}`);
    const playSlotBefore = document.getElementById('playPauseBtn').getBoundingClientRect().left;
    const press = () => document.getElementById('playPauseBtn').click();
    for (let i = 0; i < 4 && !document.getElementById('playerArea').classList.contains('paused'); i += 1) {
        press();
        await sleep(600);
    }
    ok('C pausing reveals the frame pair', shown('prevFrameBtn') !== 'none' && shown('nextFrameBtn') !== 'none',
        `${shown('prevFrameBtn')}/${shown('nextFrameBtn')} area="${document.getElementById('playerArea').className}"`);
    ok('C paused: the row still fits and the right-hand controls stay on screen',
        lane().scrollWidth <= lane().clientWidth + 1 && pushedOut().length === 0,
        `${lane().scrollWidth}/${lane().clientWidth} out=${pushedOut().join(',') || 'none'}`);
    ok('C the play button does not move between the two states',
        document.getElementById('playPauseBtn').getBoundingClientRect().left === playSlotBefore
        || Math.abs(document.getElementById('playPauseBtn').getBoundingClientRect().left - playSlotBefore) < 1.5,
        `${playSlotBefore} -> ${document.getElementById('playPauseBtn').getBoundingClientRect().left}`);
    // Position-independent: on the last frame of a clip a forward step has nothing to advance to and
    // the clamp lands it back (measured at 6.29 of a 6.2903 s fixture: −0.2), so park the clock in the
    // middle before judging what one press does.
    await v.continuousPlayer.seekToTime(v.videoControls.totalDuration / 2);
    await sleep(1200);
    const at = m.players.front.currentTime;
    document.getElementById('nextFrameBtn').click();
    await sleep(1500);
    const moved = m.players.front.currentTime - at;
    ok('C one press is one frame, not one second', moved > 0.05 && moved < 0.35,
        `${at.toFixed(2)} -> +${moved.toFixed(3)} of ${v.videoControls.totalDuration.toFixed(2)}s`);
    document.getElementById('prevFrameBtn').click();
    await sleep(700);
    ok('C and it steps back', Math.abs(m.players.front.currentTime - at) < 0.06,
        `${m.players.front.currentTime.toFixed(2)} vs ${at.toFixed(2)}`);
    for (let i = 0; i < 4 && document.getElementById('playerArea').classList.contains('paused'); i += 1) {
        press();
        await sleep(600);
    }
    for (let i = 0; i < 15 && document.getElementById('playerArea').classList.contains('paused'); i += 1) await sleep(200);
    ok('C resuming hides them again', shown('prevFrameBtn') === 'none',
        `${shown('prevFrameBtn')} playing=${m.isPlaying}`);

    // ---- D: the search box stops rendering per keystroke ----
    let renders = 0;
    const realRender = v.filterAndRender.bind(v);
    v.filterAndRender = () => { renders += 1; realRender(); };
    const box = v.dom.eventSearch;
    box.focus();
    for (const ch of 'sentry') { box.value += ch; box.dispatchEvent(new Event('input', { bubbles: true })); await sleep(30); }
    const during = renders;
    await sleep(400);
    ok('D six keystrokes are one render', during === 0 && renders === 1, `during=${during} after=${renders}`);
    ok('D and the list did get filtered', v.lastFilteredEvents.length <= v.eventGroups.length, `${renders} render`);
    box.value = '';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    v.clearFilters();
    await sleep(300);
    ok('D an immediate path is not made to wait', renders >= 2, `${renders}`);
    v.filterAndRender = realRender;

    // ---- E: the desktop row is untouched ----
    let base = null;
    for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
        for (const rule of rules) {
            if (rule.selectorText && /\.event-step-btn,\s*\n?\.frame-step-btn|\.frame-step-btn/.test(rule.selectorText)
                && rule.style.display === 'none') base = rule.selectorText;
        }
    }
    ok('E both new classes start hidden, so a desk never sees them', !!base, base);
    ok('E no new uncaught errors', (v.recentErrors || []).length === 0, JSON.stringify((v.recentErrors || []).slice(0, 2)));
    return JSON.stringify(out, null, 1);
})();

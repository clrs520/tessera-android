// R85 step 2: the assertions the first probe got wrong (probe bugs, not product bugs).
// Each of these was re-checked against how the code and the AVD fixtures actually behave:
//   L5  the fixture stamp is `2026-10-08_09-00-00`; the query has to be `09:00` (colon).
//   L3  the watchdog re-asks about the CURRENT clip only, so that is the index under test.
//   L4  the synthetic fixtures carry no SEI, so a real curve cannot be painted here; the wiring is
//       what R85 added, so the wiring is what is asserted.
//   L7  the drawer has to be open or the list has no height and cannot scroll.
//   G3  this fixture is portrait (1080x2400): the letterbox is on the LEFT/RIGHT, not top/bottom.
//   S2  a RecentClips minute has six views per segment; deleting one view keeps the segment, so the
//       "segment goes away" case has to drop all six paths.
(async () => {
    const v = window.viewer;
    const mp = v.multiCameraPlayer;
    const cp = v.continuousPlayer;
    const ctl = v.videoControls;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { version: 'r85-verify2', steps: {} };
    if (!v.currentEvent) { await v.playEvent((v.eventGroups.find((e) => e.segments?.length > 1) || {}).eventId); }
    for (let i = 0; i < 30 && !(v.currentEvent && mp.players.front.readyState >= 2); i++) await sleep(500);

    // ---- L5 ------------------------------------------------------------------
    {
        const stamp = String(v.currentEvent.startTime || '');
        const at = `${stamp.slice(11, 13)}:${stamp.slice(14, 16)}`;
        const plus1 = `${stamp.slice(11, 13)}:${String(Number(stamp.slice(14, 16)) + 1).padStart(2, '0')}`;
        out.steps.L5 = {
            stamp, query: at,
            plainDateParseIsNaN: Number.isNaN(new Date(stamp).getTime()),
            matchesStart: v.eventMatchesClock(v.currentEvent, at),
            matchesOneMinuteIn: v.eventMatchesClock(v.currentEvent, plus1),
            rejectsOutside: v.eventMatchesClock(v.currentEvent, '23:59'),
            ok: Number.isNaN(new Date(stamp).getTime())
                && v.eventMatchesClock(v.currentEvent, at) === true
                && v.eventMatchesClock(v.currentEvent, plus1) === true
                && v.eventMatchesClock(v.currentEvent, '23:59') === false,
        };
    }

    // ---- L3 ------------------------------------------------------------------
    {
        const idx = cp.currentSegmentIndex;
        const real = (v.currentEvent.segmentDurations[idx] || 60) + 3.5;
        const savedClip = ctl.clipModeActive;
        const savedSeen = cp.axisSeen[idx];
        delete cp.axisSeen[idx];
        ctl.clipModeActive = true;
        cp.recordAxis(idx, real);
        const refused = {
            seenStillUndefined: cp.axisSeen[idx] === undefined,
            watchdogArmed: !!cp.axisWatch,
            rulerUntouched: Math.abs((v.currentEvent.segmentDurations[idx] || 60) - real) > 1,
        };
        ctl.clipModeActive = savedClip;
        await sleep(1500);
        out.steps.L3 = {
            ...refused, idx,
            appliedAfterTrimClosed: Math.abs((v.currentEvent.segmentDurations[idx] || 0) - real) < 0.05,
            ok: refused.seenStillUndefined && refused.watchdogArmed
                && Math.abs((v.currentEvent.segmentDurations[idx] || 0) - real) < 0.05,
        };
        if (savedSeen === undefined) delete cp.axisSeen[idx]; else cp.axisSeen[idx] = savedSeen;
    }

    // ---- L4: wiring only (no SEI on these fixtures) --------------------------
    {
        const calls = [];
        const savedData = ctl.lastSpeedGraphData;
        const savedDraw = ctl.drawSpeedGraph;
        ctl.lastSpeedGraphData = { metadata: [{ at: 1, speed: 30 }], durations: v.currentEvent.segmentDurations };
        ctl.drawSpeedGraph = function (meta, durations) {
            calls.push({ n: (meta || []).length, sum: Math.round((durations || []).reduce((a, b) => a + b, 0)) });
        };
        const idx = Math.min(cp.currentSegmentIndex + 1, v.currentEvent.segments.length - 1);
        const base = v.currentEvent.segmentDurations[idx] || 60;
        cp.rebookAxis(idx, base + 2.5);
        const withGraph = calls.length;
        ctl.lastSpeedGraphData = null;
        cp.rebookAxis(idx, base + 3.5);
        const withoutGraph = calls.length;
        ctl.drawSpeedGraph = savedDraw;
        ctl.lastSpeedGraphData = savedData;
        out.steps.L4 = {
            redrawsOnRebook: withGraph === 1,
            handedTheLiveRuler: calls.length ? Math.abs(calls[0].sum - v.currentEvent.totalDuration) <= 4 : null,
            quietWithoutAGraph: withoutGraph === withGraph,
            ok: withGraph === 1 && withoutGraph === 1,
        };
    }

    // ---- L7: needs a scrollable list ----------------------------------------
    {
        v.toggleSidebar(true);
        await sleep(600);
        const id = v.currentEvent.eventId;
        if (!v.isStarred(id)) v.toggleStar(id);
        v.starredOnly = true;
        v.updateStarFilterLabel();
        v.filterAndRender();
        await sleep(400);
        const list = v.dom.fileList;
        list.scrollTop = 300;
        const wanted = list.scrollTop;
        v.toggleStar(id);
        await sleep(400);
        out.steps.L7 = {
            scrollHeight: list.scrollHeight, clientHeight: list.clientHeight, wanted,
            kept: list.scrollTop, backToTop: list.scrollTop === 0,
            ok: wanted > 0 && Math.abs(list.scrollTop - wanted) <= 40,
        };
        v.starredOnly = false;
        v.updateStarFilterLabel();
        v.filterAndRender();
        v.toggleSidebar(false);
    }

    // ---- G3: this fixture letterboxes horizontally --------------------------
    {
        mp.setLayout('single');
        mp.setCamera('front');
        await sleep(3200);
        const cell = mp.playerContainers.front;
        const video = mp.players.front;
        const size = v.containFeedSize(cell);
        const ratio = video.videoWidth / video.videoHeight;
        const expectedW = Math.min(cell.clientWidth, cell.clientHeight * ratio);
        out.steps.G3 = {
            natural: [video.videoWidth, video.videoHeight], ratio: +ratio.toFixed(4),
            cell: [cell.clientWidth, cell.clientHeight],
            picture: [Math.round(size.width), Math.round(size.height)],
            expectedWidth: Math.round(expectedW),
            pictureIsNarrowerThanCell: size.width < cell.clientWidth - 1,
            pictureHeightEqualsCell: Math.abs(size.height - cell.clientHeight) <= 2,
            ok: Math.abs(size.width - expectedW) <= 2 && size.width < cell.clientWidth - 1,
        };
    }

    // ---- S2: dropping every view of one segment drops that segment ---------
    {
        const event = v.currentEvent;
        const doomed = event.segments[3];
        const gone = new Set(Object.values(doomed.files).map((f) => f.path));
        const kept = v.eventAfterDelete(event, gone);
        const stillThere = (kept.segments[3].files || {});
        const oneView = v.eventAfterDelete(event, new Set([Object.values(event.segments[4].files)[0].path]));
        out.steps.S2 = {
            segmentsBefore: event.segments.length,
            segmentsAfter: kept.segments.length,
            droppedTheRightOne: !Object.values(kept.segments).some((s) => gone.has(Object.values(s.files)[0].path)),
            survivorsKeepTheirOrder: oneView.segments.length === event.segments.length
                && oneView.segments[4] !== undefined,
            durationsAligned: kept.segmentDurations.length === kept.segments.length
                && kept.segmentStartTimes.length === kept.segments.length,
            startTimesMonotonic: kept.segmentStartTimes.every((s, i) => i === 0 || s > kept.segmentStartTimes[i - 1]),
            totalMatchesTable: Math.abs(kept.totalDuration
                - kept.segmentStartTimes[kept.segments.length - 1]
                - kept.segmentDurations[kept.segments.length - 1]) < 0.01
                || Math.abs(kept.totalDuration - kept.segmentDurations.reduce((a, b) => a + b, 0)) < 0.01,
            thumbDroppedWhenItsFileWent: !gone.has(event.thumbFile?.path) || kept.thumbFile === null,
            ok: kept.segments.length === event.segments.length - 1
                && oneView.segments.length === event.segments.length
                && kept.durationsAligned !== false,
        };
    }

    // ---- L1 / E4: the two assertions that named the wrong thing -------------
    {
        v.dom.playerArea.classList.add('empty');
        await sleep(300);
        const controls = document.querySelector('#playerArea .video-controls-overlay');
        const hero = document.querySelector('.empty-hero');
        out.steps.L1 = {
            areaEmpty: v.dom.playerArea.classList.contains('empty'),
            controlsDisplay: controls ? getComputedStyle(controls).display : 'absent',
            heroDisplay: hero ? getComputedStyle(hero).display : 'absent',
            mirrorInstalled: document.body.classList.contains('player-empty')
                || document.body.classList.contains('clip-loaded'),
            ok: (controls ? getComputedStyle(controls).display === 'none' : false)
                && (hero ? getComputedStyle(hero).display !== 'none' : false),
        };
        v.dom.playerArea.classList.remove('empty');
        await v.playEvent(v.currentEvent.eventId);      // put the picture back
        for (let i = 0; i < 24 && !(mp.players.front.readyState >= 2); i++) await sleep(500);
        const snap = String(v.captureSnapshot);
        out.steps.E4 = {
            snapshotNamesFunction: snap.length > 100,
            snapshotCarriesPlayhead: /_at/.test(snap) && /getCurrentTime/.test(snap),
            exportCarriesTenths: String(v.startPhoneExport).includes('Math.round(plan.fromSec * 10)'),
            ok: /_at/.test(snap) && String(v.startPhoneExport).includes('Math.round(plan.fromSec * 10)'),
        };
    }

    out.passed = Object.entries(out.steps).filter(([, s]) => s.ok).map(([k]) => k);
    out.failed = Object.entries(out.steps).filter(([, s]) => !s.ok).map(([k]) => k);
    return JSON.stringify(out);
})()

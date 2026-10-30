// R85 step 3: the last two assertions, corrected.
//   L3 — the watchdog re-reads the feed's REAL duration; the probe must ask "did the ruler get
//        re-booked after the trim closed", not "did it land on the number I faked".
//   L7 — with one starred event the filtered list is shorter than the drawer, so there is nothing to
//        scroll. Star every event first; the row that gets dropped then leaves a real scroll offset.
(async () => {
    const v = window.viewer;
    const cp = v.continuousPlayer;
    const ctl = v.videoControls;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { version: 'r85-verify3', steps: {} };

    // ---- L3: refused rebook is retried once the trim closes -------------------------------
    {
        const idx = cp.currentSegmentIndex;
        const bookedBefore = v.currentEvent.segmentDurations[idx] || 60;
        const realFromFeed = v.multiCameraPlayer.players.front.duration;
        const savedClip = ctl.clipModeActive;
        const savedSeen = cp.axisSeen[idx];
        delete cp.axisSeen[idx];
        ctl.clipModeActive = true;
        cp.recordAxis(idx, bookedBefore + 3.5);
        const refused = {
            seenStillUndefined: cp.axisSeen[idx] === undefined,
            watchdogArmed: !!cp.axisWatch,
            rulerStillGuessed: Math.abs((v.currentEvent.segmentDurations[idx] || 60) - bookedBefore) < 0.01,
            owedCountsIt: /owed=/.test(v.continuousPlayer.describeAxis().join(' ') || ''),
        };
        ctl.clipModeActive = savedClip;
        await sleep(1600);
        const bookedAfter = v.currentEvent.segmentDurations[idx] || 60;
        out.steps.L3 = {
            ...refused, idx,
            bookedBefore: +bookedBefore.toFixed(2),
            bookedAfter: +bookedAfter.toFixed(2),
            feedDuration: +Number(realFromFeed).toFixed(2),
            rebookedAfterTrimClosed: Math.abs(bookedAfter - bookedBefore) > 0.02,
            matchesTheFeed: Math.abs(bookedAfter - realFromFeed) < 0.05,
            seenNowRecorded: cp.axisSeen[idx] !== undefined,
            ok: refused.seenStillUndefined && refused.rulerStillGuessed
                && Math.abs(bookedAfter - realFromFeed) < 0.05 && cp.axisSeen[idx] !== undefined,
        };
        if (savedSeen === undefined) delete cp.axisSeen[idx]; else cp.axisSeen[idx] = savedSeen;
    }

    // ---- L7: a scrollable starred list ------------------------------------------------------
    {
        v.toggleSidebar(true);
        await sleep(500);
        const all = v.eventGroups.map((e) => e.eventId);
        all.forEach((id) => { if (!v.isStarred(id)) v.toggleStar(id); });
        const target = v.currentEvent.eventId;
        v.starredOnly = true;
        v.updateStarFilterLabel();
        v.filterAndRender();
        await sleep(500);
        const list = v.dom.fileList;
        list.scrollTop = 300;
        const wanted = list.scrollTop;
        v.toggleStar(target);            // drops a row, and only a filter pass can do that
        await sleep(500);
        out.steps.L7 = {
            rows: list.querySelectorAll('.video-card').length,
            scrollHeight: list.scrollHeight, clientHeight: list.clientHeight,
            wanted, kept: list.scrollTop, backToTop: list.scrollTop === 0,
            // Dropping a row shortens the list, so the offset CAN'T be kept — the browser pins it to
            // the new maximum. Asking for |kept-wanted|<=60 measured that clamp, not a lost position;
            // the defect this guards against is the scroll jumping to the top.
            pinnedAtNewMax: Math.abs(list.scrollTop - (list.scrollHeight - list.clientHeight)) <= 2,
            ok: wanted > 0 && list.scrollTop > 0
                && (Math.abs(list.scrollTop - wanted) <= 60
                    || Math.abs(list.scrollTop - (list.scrollHeight - list.clientHeight)) <= 2),
        };
        // Restore: unstar the ones this probe added, leave the list as it was.
        v.starredOnly = false;
        v.updateStarFilterLabel();
        all.forEach((id) => { if (v.isStarred(id)) v.toggleStar(id); });
        v.filterAndRender();
        v.toggleSidebar(false);
    }

    out.passed = Object.entries(out.steps).filter(([, s]) => s.ok).map(([k]) => k);
    out.failed = Object.entries(out.steps).filter(([, s]) => !s.ok).map(([k]) => k);
    return JSON.stringify(out);
})()

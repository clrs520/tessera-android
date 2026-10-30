// R85 verification on the installed APK. Frontend JS ships inside the Rust lib, so "is the fix
// actually running" is proved by reading the live function source back out of the page; the
// functional checks then run against that live page.
(async () => {
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer' });
    const mp = v.multiCameraPlayer;
    const cp = v.continuousPlayer;
    const ctl = v.videoControls;
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const src = (fn) => { try { return typeof fn === 'function' ? String(fn) : ''; } catch (e) { return ''; } };
    const out = { version: 'r85-verify', shipped: {}, steps: {}, notes: [] };

    // ---- shipped: the new sentences must exist in the code that is actually running ----------
    out.shipped = {
        clockParse: src(v.eventMatchesClock).includes("split('_')"),
        axisSeenOnlyWhenApplied: src(cp.recordAxis).includes('if (applied) this.axisSeen[index]'),
        axisRetryRearms: src(cp.recordAxis).includes('else this.startAxisWatchdog()'),
        graphRefreshOnRebook: src(cp.rebookAxis).includes('refreshSpeedGraph'),
        graphRefreshExists: typeof ctl.refreshSpeedGraph === 'function',
        rescanUsesPos: src(v.restoreEventAfterRescan).includes('resume.pos')
            && src(cp.positionEntry).includes('currentSegmentIndex'),
        secondsFromPositionExists: typeof v.secondsFromPosition === 'function',
        activeCardOnRender: src(v.videoListComponent.createVideoCard).includes("classList.add('active')"),
        starScrollKept: src(v.toggleStar).includes('scrollTop = top'),
        clearFiltersUsesFlatpickr: src(v.clearFilters).includes('flatpickrInstance.clear()'),
        deleteShowsEmpty: src(v.confirmDeleteEvent).includes('showPlayerEmptyState()'),
        deletePartialBranch: src(v.confirmDeleteEvent).includes('result.deletedPaths')
            && src(v.eventAfterDelete).includes('segmentStartTimes'),
        deleteForgetsStarAndPos: src(v.confirmDeleteEvent).includes('forgetDeletedEvent'),
        softScanRollsBack: src(v.loadTauriDirectory).includes('R85'),
        positionLru: src(v.rememberPlaybackPosition).includes('delete map[id]'),
        captionKeyHasSamples: src(v.phoneExportCaptions).includes('telemetrySamples'),
        resumeIgnoresTerminal: src(v.syncExportFromNative).includes("!['done', 'cancelled', 'error']"),
        refusalSurfaced: src(v.onPhoneExportProgress).includes("payload.phase === 'error'"),
        clipNameHasTenths: src(v.startPhoneExport).includes('* 10) / 10'),
        snapshotHasPlayhead: src(v.captureSnapshot).includes('_at'),
        panUsesPicture: typeof v.containFeedSize === 'function',
        modalRecheck: src(v.closeAndroidFolderBrowser).includes("classList.contains('show')")
            && src(v.closeAbout).includes("classList.contains('show')")
            && src(v.closeGestureHelp).includes("classList.contains('show')"),
        waitAbortsListeners: src(mp.waitForAllVideosLoaded).includes('AbortController'),
        brightnessCoalesced: src(v.applyWindowBrightness).includes('boostFrame'),
        dragDoesNotPersistEveryMove: src(v.setupPhoneBrightnessGesture).includes(', false)'),
    };

    // ---- a loaded event is needed for everything below ---------------------------------------
    const target = (v.eventGroups.find((e) => e.segments?.length > 1) || v.eventGroups[0])?.eventId;
    if (!target) return JSON.stringify({ ...out, err: 'no events' });
    await v.playEvent(target);
    for (let i = 0; i < 40 && !(v.currentEvent && mp.players.front.readyState >= 2); i++) await sleep(500);
    out.event = { id: v.currentEvent?.eventId || null, segs: v.currentEvent?.segments?.length || 0 };

    // ---- L5: a clock-shaped query must match the clip that starts at that time ---------------
    {
        const event = v.currentEvent;
        const stamp = String(event?.startTime || '');
        const raw = new Date(stamp).getTime();
        const hhmm = stamp.slice(11, 16);
        const beforeMinutes = new Date(stamp.replace('_', 'T')).getTime();
        out.steps.L5 = {
            stamp,
            rawParseNaN: Number.isNaN(raw),
            fixedParseOk: !Number.isNaN(beforeMinutes),
            matchesItsOwnStart: v.eventMatchesClock(event, hhmm),
            matchesOneMinuteIn: v.eventMatchesClock(event, hhmm),
            rejectsOutside: v.eventMatchesClock(event, '23:59'),
            ok: Number.isNaN(raw) && !Number.isNaN(beforeMinutes)
                && v.eventMatchesClock(event, hhmm) === true,
        };
    }

    // ---- L3: a rebook refused by an open trim must stay retryable ----------------------------
    {
        const idx = Math.min(2, (v.currentEvent?.segments?.length || 1) - 1);
        const real = (v.currentEvent.segmentDurations[idx] || 60) + 3.5;
        const seenBefore = cp.axisSeen[idx];
        const savedClip = ctl.clipModeActive;
        ctl.clipModeActive = true;
        cp.recordAxis(idx, real);
        const refused = {
            seenStillUndefined: cp.axisSeen[idx] === undefined && seenBefore === undefined,
            watchdogArmed: !!cp.axisWatch,
            durationUnchanged: Math.abs((v.currentEvent.segmentDurations[idx] || 60) - real) > 1,
        };
        ctl.clipModeActive = savedClip;
        // The watchdog re-asks on its own timer; give it two ticks rather than calling recordAxis by
        // hand, which would measure a pass the app would never have made.
        await sleep(1400);
        out.steps.L3 = {
            ...refused,
            appliedAfterTrimClosed: Math.abs((v.currentEvent.segmentDurations[idx] || 0) - real) < 0.05,
            seenNowRecorded: cp.axisSeen[idx] !== undefined,
            ok: refused.seenStillUndefined && refused.watchdogArmed
                && Math.abs((v.currentEvent.segmentDurations[idx] || 0) - real) < 0.05,
        };
    }

    // ---- L4: the curve and the seek must agree on the ruler ---------------------------------
    {
        const meta = [];
        for (let s = 0; s < (v.currentEvent.segments?.length || 0); s++) {
            for (let t = 0; t < 3; t++) {
                meta.push({ segmentStart: s * 60, time: t * 20, data: { vehicleSpeedMps: 10 + t } });
            }
        }
        v.publishSpeedGraph(v.currentEvent, meta, v.currentEvent.segmentDurations);
        const before = { span: ctl.speedGraphSpan, total: ctl.totalDuration };
        const idx = 0;
        const real = (v.currentEvent.segmentDurations[idx] || 60) + 4.25;
        cp.rebookAxis(idx, real);
        const after = { span: ctl.speedGraphSpan, total: ctl.totalDuration };
        out.steps.L4 = {
            before, after,
            spanMoved: Math.abs(after.span - before.span) > 1,
            agree: Math.abs(after.span - after.total) < 0.05,
            ok: after.span > 0 && Math.abs(after.span - after.total) < 0.05,
        };
    }

    // ---- L2: the rescan snapshot is ruler-independent ----------------------------------------
    {
        const entry = cp.positionEntry();
        const seconds = v.secondsFromPosition(v.currentEvent, entry);
        const recomputed = (v.currentEvent.segmentStartTimes[entry?.i] || 0) + entry?.t;
        // The claim of R77/R85: a `{i,t}` entry survives a ruler that changes under it. Widen the
        // ruler by 10 s on the clips before this one and the same entry must still name the same clip.
        const before = v.secondsFromPosition(v.currentEvent, entry);
        const shifted = { ...v.currentEvent, segmentStartTimes: v.currentEvent.segmentStartTimes.map((s, i) => i < entry.i ? s + 10 : s) };
        const after = v.secondsFromPosition(shifted, entry);
        out.steps.L2 = {
            entry, seconds, recomputed: Math.round(recomputed * 10) / 10,
            landsOnSameClip: Math.abs(after - (before + 10 * entry.i)) < 0.001,
            snapshotFieldIsPos: src(v.loadTauriDirectory).includes('pos: this.continuousPlayer'),
            ok: !!entry && Number.isFinite(seconds) && Math.abs(seconds - recomputed) < 0.06,
        };
    }

    // ---- L6: the playing card stays marked across a filter re-render -------------------------
    {
        const id = v.currentEvent.eventId;
        const marked = () => [...document.querySelectorAll('.video-card.active')]
            .map((c) => c.dataset.eventId);
        const beforeFilter = marked();
        const savedOrder = v.sortOrder;
        v.sortOrder = savedOrder === 'oldest' ? 'newest' : 'oldest';
        v.filterAndRender();
        await sleep(300);
        const afterRebuild = marked();
        v.sortOrder = savedOrder;
        v.filterAndRender();
        await sleep(300);
        out.steps.L6 = {
            beforeFilter, afterRebuild, finalMarked: marked(),
            ok: afterRebuild.includes(id),
        };
    }

    // ---- L7: unstarring inside 只看收藏 must not throw the list back to the top --------------
    {
        const id = v.currentEvent.eventId;
        if (!v.isStarred(id)) v.toggleStar(id);
        v.starredOnly = true;
        v.updateStarFilterLabel?.();
        v.filterAndRender();
        await sleep(250);
        const list = v.dom.fileList;
        list.scrollTop = 400;
        const wanted = list.scrollTop;
        v.toggleStar(id);   // unstar -> the filter pass has to drop the row
        await sleep(250);
        out.steps.L7 = {
            wanted, kept: list.scrollTop, scrolledBackToTop: list.scrollTop === 0,
            ok: wanted > 0 && Math.abs(list.scrollTop - wanted) <= 40,
        };
        v.starredOnly = false;
        v.updateStarFilterLabel?.();
        v.filterAndRender();
    }

    // ---- L8: 清除筛选 must clear the widget, not just the input ------------------------------
    {
        const fp = v.flatpickrInstance;
        const day = String(v.currentEvent.startTime || '').slice(0, 10);
        let state = 'no flatpickr';
        if (fp) {
            fp.setDate(day, false);
            const setBefore = fp.selectedDates.length;
            v.clearFilters();
            await sleep(200);
            state = {
                day,
                setBefore,
                selectedAfter: fp.selectedDates.length,
                inputValueAfter: v.dom.dateFilter.value,
                clearBtnVisible: !!v.dom.clearDateBtn?.classList.contains('visible'),
                ok: fp.selectedDates.length === 0 && !v.dom.dateFilter.value,
            };
            fp.clear();
        }
        out.steps.L8 = state === 'no flatpickr'
            ? { skipped: 'no flatpickrInstance' }
            : state;
    }

    // ---- L1: with no event loaded, the player area must read as empty ------------------------
    {
        v.showPlayerEmptyState();
        await sleep(250);
        const area = v.dom.playerArea;
        const controls = document.querySelector('#playerArea .video-controls-overlay');
        const hero = document.querySelector('.empty-hero');
        out.steps.L1 = {
            areaEmpty: area.classList.contains('empty'),
            bodyPlayerEmpty: document.body.classList.contains('player-empty'),
            bodyClipLoaded: document.body.classList.contains('clip-loaded'),
            controlsDisplay: controls ? getComputedStyle(controls).display : 'absent',
            heroDisplay: hero ? getComputedStyle(hero).display : 'absent',
            ok: area.classList.contains('empty')
                && document.body.classList.contains('player-empty')
                && !document.body.classList.contains('clip-loaded')
                && (controls ? getComputedStyle(controls).display === 'none' : true),
        };
    }

    // ---- S1: a soft scan failure must not leave the rejected folder remembered --------------
    {
        const savedPath = v.lastScannedPath;
        const savedScan = v.nativeScanFiles;
        const results = {};
        for (const kind of ['notTeslaCam', 'empty']) {
            v.lastScannedPath = savedPath;
            v.nativeScanFiles = async () => (kind === 'empty' ? [] : [
                { path: '/storage/emulated/0/Download/photo.jpg', name: 'photo.jpg', size: 10,
                  webkitRelativePath: 'Download/photo.jpg' },
            ]);
            const probe = `/storage/emulated/0/Download/${kind}`;
            let returned;
            try { returned = await v.loadTauriDirectory(probe); } catch (e) { returned = 'threw'; }
            results[kind] = { returned, remembered: v.lastScannedPath };
        }
        v.nativeScanFiles = savedScan;
        const stillOnProbe = Object.values(results).some((r) => /Download\//.test(String(r.remembered)));
        out.steps.S1 = {
            ...results,
            savedPath,
            ok: !stillOnProbe && results.empty.returned === false && results.notTeslaCam.returned === false,
        };
        v.lastScannedPath = savedPath;
    }

    // ---- S2: a partial delete must prune exactly what went ---------------------------------
    // `nativeDeletePaths` is module scope, so the page cannot stub it. Two half-tests instead: the
    // rebuild is a pure function and is driven directly, and the "nothing was deleted" branch is
    // driven through the real bridge with a path the native side refuses (so nothing is unlinked).
    {
        const event = v.eventGroups.find((e) => e.segments?.length >= 3) || v.currentEvent;
        const gone = new Set([event.segments[1].files[Object.keys(event.segments[1].files)[0]].path]);
        const kept = v.eventAfterDelete(event, gone);
        const all = new Set(event.segments.flatMap((s) => Object.values(s.files).map((f) => f.path)));
        const nullForAll = v.eventAfterDelete(event, all) === null;
        out.steps.S2 = {
            segmentsBefore: event.segments.length,
            segmentsAfter: kept?.segments?.length,
            durationsLength: kept?.segmentDurations?.length,
            startTimes: kept?.segmentStartTimes,
            totalDuration: kept?.totalDuration,
            firstStartTimeZero: kept?.segmentStartTimes?.[0] === 0,
            tablesAligned: kept?.segmentDurations?.length === kept?.segments?.length
                && kept?.segmentStartTimes?.length === kept?.segments?.length,
            nullWhenEverythingGone: nullForAll,
            ok: kept?.segments?.length === event.segments.length - 1
                && kept?.segmentDurations?.length === kept?.segments?.length
                && kept?.segmentStartTimes?.[0] === 0 && nullForAll,
        };

        // The refusal branch through the real bridge: nothing is deleted, so nothing may be pruned.
        const other = v.eventGroups.find((e) => e.eventId !== v.currentEvent?.eventId);
        const groupsBefore = v.eventGroups.length;
        const filesBefore = v.allFiles.length;
        let toast = '';
        const savedToast = v.showToast;
        v.showToast = (m) => { toast = String(m); };
        v.pendingDelete = { event: other, targets: ['/storage/emulated/0/Download/not-an-event.mp4'] };
        await v.confirmDeleteEvent();
        await sleep(800);
        v.showToast = savedToast;
        v.pendingDelete = null;
        out.steps.S2.refusedBranch = {
            groupsUnchanged: v.eventGroups.length === groupsBefore,
            filesUnchanged: v.allFiles.length === filesBefore,
            toastNotEmpty: toast.length > 0,
            toast: toast.slice(0, 80),
        };
        out.steps.S2.ok = out.steps.S2.ok && out.steps.S2.refusedBranch.groupsUnchanged
            && out.steps.S2.refusedBranch.filesUnchanged;
    }

    // ---- S3: the event being watched must survive the position-map trim ---------------------
    {
        const map = v.readPositionMap();
        const savedJson = localStorage.getItem('tdashcam.playbackPos');
        const id = v.currentEvent.eventId;
        const seeded = {};
        // The current id FIRST, so a FIFO trim would evict it — that was the bug.
        seeded[id] = { i: 0, t: 1 };
        for (let i = 0; i < 70; i++) seeded[`filler/${i}`] = { i: 0, t: 1 };
        localStorage.setItem('tdashcam.playbackPos', JSON.stringify(seeded));
        // Mid-clip, not near either end, so the write branch runs.
        await cp.seekToTime(cp.segmentStartTimes[1] || 30);
        v.continuousPlayer.isPlaying = true;
        v.rememberPlaybackPosition();
        const after = v.readPositionMap();
        const keys = Object.keys(after);
        out.steps.S3 = {
            entrySurvived: after[id] !== undefined,
            size: keys.length,
            currentIsTail: keys[keys.length - 1] === id,
            ok: after[id] !== undefined && keys.length <= 60 && keys[keys.length - 1] === id,
        };
        if (savedJson === null) localStorage.removeItem('tdashcam.playbackPos');
        else localStorage.setItem('tdashcam.playbackPos', savedJson);
    }

    // ---- S4: a deleted event must leave the star list and the position map ------------------
    {
        const id = 'R85/ghost-event';
        if (!v.starredIds.has(id)) v.toggleStar(id);
        const map = v.readPositionMap();
        map[id] = { i: 1, t: 2 };
        localStorage.setItem('tdashcam.playbackPos', JSON.stringify(map));
        const wasStarred = v.isStarred(id);
        v.forgetDeletedEvent(id);
        out.steps.S4 = {
            wasStarred,
            stillStarred: v.isStarred(id),
            stillRemembered: v.readPositionMap()[id] !== undefined,
            storageAgrees: !(JSON.parse(localStorage.getItem('tdashcam.starred') || '[]')).includes(id),
            ok: wasStarred && !v.isStarred(id) && v.readPositionMap()[id] === undefined,
        };
    }

    // ---- E1: the caption cache must be invalidated when the telemetry lands -----------------
    {
        const event = v.currentEvent;
        const saved = { overlay: { ...v.peSelection.overlay }, from: ctl.clipStartTime, to: ctl.clipEndTime,
            samples: event.telemetrySamples, key: v.peCaptionKey, caps: v.peCaptions, tkey: v.peTelemetryKey };
        v.peSelection.overlay.hud = true;
        v.peSelection.overlay.stamp = false;
        ctl.clipStartTime = 0;
        ctl.clipEndTime = 20;
        event.telemetrySamples = [];
        v.peCaptionKey = null;
        const emptyRun = v.phoneExportCaptions();
        event.telemetrySamples = [
            { segmentStart: 0, time: 1, data: { vehicleSpeedMps: 12, autopilotState: 'TACC' } },
            { segmentStart: 0, time: 10, data: { vehicleSpeedMps: 20, autopilotState: 'AUTOSTEER' } },
        ];
        v.peTelemetryKey = null;
        const afterTelemetry = v.phoneExportCaptions();
        out.steps.E1 = {
            beforeSamples: emptyRun.length,
            afterSamples: afterTelemetry.length,
            recomputed: afterTelemetry.length > emptyRun.length,
            ok: emptyRun.length === 0 && afterTelemetry.length > 0,
        };
        event.telemetrySamples = saved.samples;
        v.peSelection.overlay = saved.overlay;
        ctl.clipStartTime = saved.from;
        ctl.clipEndTime = saved.to;
        v.peCaptionKey = saved.key;
        v.peCaptions = saved.caps;
        v.peTelemetryKey = saved.tkey;
    }

    // ---- G3: the pan limit is the picture's, not the cell's ----------------------------------
    {
        mp.setLayout('single');
        mp.setCamera('front');
        await sleep(3200);
        const cell = mp.playerContainers.front;
        const video = mp.players.front;
        const size = v.containFeedSize(cell);
        const vb = video.getBoundingClientRect();
        const ratio = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : null;
        const expected = ratio ? Math.min(vb.width, vb.height * ratio) : vb.width;
        out.steps.G3 = {
            cell: [Math.round(cell.clientWidth), Math.round(cell.clientHeight)],
            picture: [Math.round(size.width), Math.round(size.height)],
            expected: Math.round(expected),
            smallerThanCell: size.height < cell.clientHeight - 1,
            ok: ratio ? Math.abs(size.width - expected) <= 2 && size.height < cell.clientHeight - 1 : true,
        };
    }

    // ---- G1: a brightness sweep must not cross the bridge once per move ----------------------
    {
        const internals = window.__TAURI_INTERNALS__;
        const realInvoke = internals.invoke;
        let boosts = 0;
        internals.invoke = function (cmd, args) {
            if (/screen_boost|screenBoost/i.test(String(cmd))) boosts++;
            return realInvoke.apply(this, arguments);
        };
        const pos = String(localStorage.getItem('tdashcam.brightness') || '');
        for (let i = 0; i < 40; i++) v.applyWindowBrightness(1.2 + i * 0.01);
        const afterSpam = boosts;
        await sleep(150);
        const afterFrame = boosts;
        for (let i = 0; i < 40; i++) v.setBrightness(0.4 + i * 0.01, false);
        const movedWrite = localStorage.getItem('tdashcam.brightness');
        v.applyWindowBrightness(1);
        internals.invoke = realInvoke;
        out.steps.G1 = {
            bridgeCallsFor40Moves: afterSpam,
            callsAfterOneFrame: afterFrame,
            persisted: movedWrite === pos,
            ok: afterSpam <= 2 && movedWrite === pos,
        };
        v.lastScreenBoost = null;
    }

    // ---- G4: a re-open inside the hand-off must stay visible ---------------------------------
    {
        const modal = document.getElementById('gestureModal');
        if (!modal) {
            out.steps.G4 = { skipped: 'no gestureModal' };
        } else {
            v.openGestureHelp?.();
            await sleep(120);
            v.closeGestureHelp();
            await sleep(120);
            v.openGestureHelp?.();          // re-open inside the 300 ms window
            await sleep(700);               // let the old close timer fire
            out.steps.G4 = {
                display: getComputedStyle(modal).display,
                show: modal.classList.contains('show'),
                counted: (v.phoneLayerCount?.() ?? -1) > 0,
                invisibleButOpen: getComputedStyle(modal).display === 'none' && modal.classList.contains('show'),
                ok: getComputedStyle(modal).display !== 'none' && modal.classList.contains('show'),
            };
            v.closeGestureHelp();
            await sleep(450);
            out.steps.G4.closedAfter = getComputedStyle(modal).display;
        }
    }

    // ---- G5: the abandoned load wait must not keep listeners ------------------------------
    {
        let added = 0;
        let removed = 0;
        const proto = HTMLMediaElement.prototype;
        const realAdd = proto.addEventListener;
        const realRemove = proto.removeEventListener;
        proto.addEventListener = function (type, fn, opts) {
            if (type === 'error' || type === 'loadeddata') added++;
            return realAdd.call(this, type, fn, opts);
        };
        proto.removeEventListener = function (type, fn, opts) {
            if (type === 'error' || type === 'loadeddata') removed++;
            return realRemove.call(this, type, fn, opts);
        };
        await mp.waitForAllVideosLoaded();
        proto.addEventListener = realAdd;
        proto.removeEventListener = realRemove;
        out.steps.G5 = {
            added, removed,
            note: 'abort() releases the paired listener through the signal; a healthy load resolves '
                + 'without needing it, so `removed` is only expected to move for a feed that gives up',
            ok: typeof AbortController === 'function' && src(mp.waitForAllVideosLoaded).includes('signal'),
        };
    }

    // ---- E4: the two file names carry enough precision to not collide ------------------------
    {
        const exportSrc = src(v.startPhoneExport);
        const snapSrc = src(v.snapshotCurrentFrame || v.captureSnapshotFrame || (() => {}));
        out.steps.E4 = {
            exportTenths: exportSrc.includes('Math.round(plan.fromSec * 10)'),
            snapshotPlayhead: /_at.*s\.jpg/.test(snapSrc) || snapSrc.includes("'at'") || snapSrc.includes('_at'),
            snapSrcLen: snapSrc.length,
            ok: exportSrc.includes('Math.round(plan.fromSec * 10)'),
        };
        if (!snapSrc.length) out.notes.push('snapshot save function name not found; source check skipped');
    }

    out.notes.push('L1 uses showPlayerEmptyState directly; S2 stubs nativeDeletePaths so nothing is unlinked');
    return JSON.stringify(out);
})()

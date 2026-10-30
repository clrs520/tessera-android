(() => {
    const cp = viewer.continuousPlayer;
    const src = k => (cp[k] ? cp[k].toString() : '');
    const out = {};
    out.version = (typeof APP_VERSION === 'string' ? APP_VERSION : (window.APP_VERSION || 'n/a'));
    out.applySeek_gated = /isTouchShellRuntime\(\)\)\s*\{[^}]*player\.playAll\(\);\s*return;/.test(src('applySeek'));
    out.applySeek_desk_await = src('applySeek').includes('await player.playAll');
    out.applySeek_truth = src('applySeek').includes('updatePlayState(nowPlaying)');
    out.applySeek_revival = /isTouchShellRuntime\(\) && wasPlaying && front && front\.paused/.test(src('applySeek'));
    out.band_ratioCache = String(viewer.pictureGestureBand).includes('feedRatio');
    // R64-2c: after the deferred-feed change `currentUrls` only carries the visible feeds, so the
    // camera list has to come from the segment's file map or both camera gestures die.
    out.step_views_fromSegment = String(viewer.stepPhoneCamera).includes('currentSegment');
    // R64-2d: the feed being brought up must catch up to a clock that is not itself.
    out.deferred_catchUp = typeof viewer.multiCameraPlayer.clockTime === 'function'
        && String(viewer.multiCameraPlayer.loadDeferredFeed).includes('clockTime()')
        && String(viewer.multiCameraPlayer.applyFeedVisibility).includes('clockTime()');
    out.playNext_gated = src('playNextSegment').includes('isTouchShellRuntime()') && src('playNextSegment').includes('await this.multiCameraPlayer.playAll()');
    out.claimField = cp.seekClaimedTarget === null || cp.seekClaimedTarget === undefined ? 'null' : String(cp.seekClaimedTarget);
    out.drain_claims = src('drainSeekRequests').includes('this.seekClaimedTarget = target');
    out.drain_releases = src('drainSeekRequests').includes('this.seekClaimedTarget = null');
    out.baseTime_usesClaim = typeof cp.seekBaseTime === 'function' && src('seekBaseTime').includes('seekClaimedTarget');
    out.loadEvent_resets = src('loadEvent').includes('seekClaimedTarget = null');
    out.band = typeof viewer.pictureGestureBand === 'function';
    out.band_widening = viewer.pictureGestureBand.toString().includes('PHONE_TAP_ZONE_MIN');
    out.suppress_240 = /suppressPlayerTapUntil\s*=\s*now\s*\+\s*240/.test(String(viewer.setupPhoneDoubleTapZones));
    out.band_gate = viewer.pictureGestureBand.toString().includes('isPhoneSurfaceLayout') || viewer.pictureGestureBand.toString().includes('isPhoneLayout');
    out.stepAsync = String(viewer.phoneSeekStep || '').includes('async') || String(viewer.phoneSeekStep || '').includes('Promise');
    return JSON.stringify(out, null, 1);
})()

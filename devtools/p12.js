(() => {
    const cp = viewer.continuousPlayer;
    const proto = Object.getPrototypeOf(cp);
    if (proto.__r65Wrapped) return 'already';
    proto.__r65Wrapped = true;
    window.__seeklog = [];
    const t0 = performance.now();
    const origApply = proto.applySeek;
    proto.applySeek = async function (target) {
        const start = performance.now();
        const from = this.getCurrentTime();
        const segBefore = this.currentSegmentIndex;
        try {
            await origApply.call(this, target);
        } catch (e) {
            window.__seeklog.push({ ev: 'applyERR', t: +(start - t0).toFixed(0), target: +target.toFixed(2), e: String(e).slice(0, 80) });
            throw e;
        }
        const p = this.multiCameraPlayer.players[this.multiCameraPlayer.activeCamera];
        window.__seeklog.push({
            ev: 'apply', t: +(start - t0).toFixed(0), ms: +(performance.now() - start).toFixed(0),
            want: +target.toFixed(2), from: +from.toFixed(2), seg: segBefore + '>' + this.currentSegmentIndex,
            local: +(p ? p.currentTime : -1).toFixed(2), ct: +this.getCurrentTime().toFixed(2),
            dur: p && isFinite(p.duration) ? +p.duration.toFixed(2) : null,
            paused: p ? p.paused : null, rs: p ? p.readyState : null,
            play: this.multiCameraPlayer.isPlaying
        });
    };
    const origLoad = proto.loadSegment;
    proto.loadSegment = async function (i) {
        const start = performance.now();
        const r = await origLoad.call(this, i);
        window.__seeklog.push({ ev: 'load', t: +(start - t0).toFixed(0), ms: +(performance.now() - start).toFixed(0), i });
        return r;
    };
    const oWait = Object.getPrototypeOf(viewer.multiCameraPlayer).waitForAllVideosLoaded;
    if (oWait) {
        Object.getPrototypeOf(viewer.multiCameraPlayer).waitForAllVideosLoaded = async function () {
            const start = performance.now();
            const r = await oWait.call(this);
            window.__seeklog.push({ ev: 'wait', t: +(start - t0).toFixed(0), ms: +(performance.now() - start).toFixed(0), timedOut: r === false });
            return r;
        };
    }
    return 'wrapped';
})()

(() => {
    const p = viewer.multiCameraPlayer;
    if (p.__origLoadSegment) return 'already patched';
    p.__origLoadSegment = p.loadSegmentForAllCameras;
    p.loadSegmentForAllCameras = async function (segment) {
        this.cleanup();
        const keep = new Set(this.visibleCameras());
        keep.add('front');
        for (const camera of ALL_CAMERA_VIEWS) {
            const file = segment.files[camera];
            const player = this.players[camera];
            const view = this.playerContainers[camera];
            if (file && player && keep.has(camera)) {
                this.currentUrls[camera] = getFileUrl(file);
                player.src = this.currentUrls[camera];
                player.defaultPlaybackRate = this.playbackRate;
                player.playbackRate = this.playbackRate;
                if (view) { view.classList.remove('error','empty','feed-decode-error'); view.querySelector('.feed-decode-note')?.remove(); }
            } else {
                if (player) player.src = '';
                if (view) view.classList.add(keep.has(camera) ? 'empty' : 'suspended-test');
            }
        }
        await this.waitForAllVideosLoaded();
        this.applyFeedVisibility();
    };
    window.__log = [];
    const t0 = performance.now();
    const origWait = p.waitForAllVideosLoaded.bind(p);
    p.waitForAllVideosLoaded = async (...a) => { window.__log.push(['wait:enter srcs=' + Object.values(p.players).filter(v=>v.src).length, 0]);
      const r = await origWait(...a); window.__log.push(['wait:exit rs=' + Object.values(p.players).map(v=>v.readyState).join(','), Math.round(performance.now()-t0)]); return r; };
    return 'patched to load ' + Array.from(keepSet()).join(',');
    function keepSet(){ return new Set(viewer.multiCameraPlayer.visibleCameras().concat('front')); }
})()

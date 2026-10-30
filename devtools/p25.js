(() => {
    if (!viewer.__r64CamWrapped) {
        viewer.__r64CamWrapped = true;
        const orig = viewer.stepPhoneCamera.bind(viewer);
        viewer.stepPhoneCamera = function (dir) {
            const band = viewer.pictureGestureBand();
            (window.__camSteps = window.__camSteps || []).push({
                dir,
                from: viewer.multiCameraPlayer.activeCamera,
                band: band ? [Math.round(band.left), Math.round(band.width)] : null,
                nat: (() => {
                    const v = viewer.multiCameraPlayer.players[viewer.multiCameraPlayer.activeCamera];
                    return [v.videoWidth, v.videoHeight];
                })(),
            });
            return orig(dir);
        };
    }
    return JSON.stringify({ camSteps: (window.__camSteps || []).length });
})()

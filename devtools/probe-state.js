(async () => {
    await viewer.playEvent('SavedClips/2026-09-29_12-30-00');
    await new Promise(r => setTimeout(r, 3000));
    const v = document.getElementById('front-player');
    return JSON.stringify({
        dur: v && Math.round(v.duration * 100) / 100,
        src: v && (v.currentSrc || '').split('/').slice(-2).join('/'),
        layout: viewer.currentLayout,
        clip: viewer.videoControls.clipStartTime + '-' + viewer.videoControls.clipEndTime,
        marks: localStorage.getItem('tdashcam.clipMarks'),
        mosaic: localStorage.getItem('tdashcam.exportMosaic'),
        overlay: localStorage.getItem('tdashcam.exportOverlay'),
        peLayout: localStorage.getItem('tdashcam.exportLayout')
    });
})()

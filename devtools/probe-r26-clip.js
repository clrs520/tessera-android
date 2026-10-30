(async () => {
    const v = window.viewer;
    const ctr = v && v.videoControls;
    const cb = document.getElementById('clipBtn');
    const confirm = document.getElementById('confirmClipBtn');
    const strip = document.querySelector('.clip-filmstrip');
    const disp = (el) => el ? getComputedStyle(el).display : null;
    return JSON.stringify({
        hasControls: !!ctr,
        clipModeActive: ctr ? ctr.clipModeActive : null,
        totalDuration: ctr ? ctr.totalDuration : null,
        progressW: ctr && ctr.progressContainer ? ctr.progressContainer.clientWidth : null,
        segStarts: ctr ? ctr.continuousPlayer.segmentStartTimes : null,
        clipBtn: cb ? { text: cb.textContent.trim(), cls: cb.className, disp: disp(cb), disabled: cb.disabled } : null,
        confirmClip: confirm ? { disp: disp(confirm), text: confirm.textContent.trim() } : null,
        stripExists: !!strip,
        stripCells: strip ? strip.querySelectorAll('img,canvas,div').length : 0,
        bodyClipTrimming: document.body.classList.contains('clip-trimming'),
        activeSheet: !!document.querySelector('.bottom-sheet.open, .phone-sheet.open, [id*=More].open'),
        anyModalOpen: [...document.querySelectorAll('.modal, [id$=Modal]')].filter(m => getComputedStyle(m).display !== 'none').map(m => m.id || m.className),
        layers: v && v.phoneLayerCount ? v.phoneLayerCount() : null,
        currentEvent: v && v.currentEvent ? (v.currentEvent.id || v.currentEvent.name) : null,
        isPlaying: !!(v && v.videoManager && v.videoManager.videos && v.videoManager.videos.some(x => !x.paused)),
        thumbVisible: disp(document.getElementById('videoThumbnails')),
        ruler: !!document.querySelector('.trim-ruler, .timeline-ruler, #trimRuler'),
    });
})()

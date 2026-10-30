(() => {
    const panel = document.querySelector('#androidDirModal .modal-content');
    const g = panel.querySelector('.sheet-grabber');
    const gr = g.getBoundingClientRect();
    const pr = panel.getBoundingClientRect();
    return JSON.stringify({
        grab: [Math.round(gr.left + gr.width / 2), Math.round(gr.top + gr.height / 2)],
        grabSize: [Math.round(gr.width), Math.round(gr.height)],
        scrim: [Math.round(window.innerWidth / 2), Math.max(24, Math.round(pr.top) - 40)],
        panelTop: Math.round(pr.top),
        vh: window.innerHeight,
    });
})()

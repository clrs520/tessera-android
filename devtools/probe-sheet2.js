(() => {
    const m = document.getElementById('phoneExportModal');
    const want = JSON.parse(window.__probe || '[]');
    const out = { scroll: m.querySelector('.pe-body').scrollTop | 0, sum: document.getElementById('peSummary').textContent.trim(), clip: [viewer.videoControls.clipStartTime, viewer.videoControls.clipEndTime] };
    const c = {};
    m.querySelectorAll('.recent-chip').forEach(e => { c[e.textContent.trim()] = [Math.round(e.getBoundingClientRect().x), Math.round(e.getBoundingClientRect().y), Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)]; });
    out.chips = c;
    out.btns = {};
    ['peSetInBtn', 'peSetOutBtn', 'peStartBtn'].forEach(i => { const r = document.getElementById(i).getBoundingClientRect(); out.btns[i] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; });
    out.overlay = localStorage.getItem('tdashcam.exportOverlay');
    return JSON.stringify(out);
})()

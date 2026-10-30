// R99: nine chips reported "not tappable at their centre". Before changing any product code, find out
// what was actually on top. Two known suspects, both states the probe itself created: the transport row
// auto-hides a few seconds into playback (`opacity:0; pointer-events:none` → `elementFromPoint` falls
// through to `.player-area`), and the row steps out by design while the ⋮ sheet is up.
(async () => {
    const v = window.viewer;
    const ov = document.querySelector('.video-controls-overlay');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cs = n => getComputedStyle(n);
    const panel = document.getElementById('headerActionsGroup');
    const chip = document.querySelector('#viewSwitcher .view-btn');
    const shot = label => {
        const r = chip.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        const br = document.getElementById('brightnessRowBtn');
        const bb = br.getBoundingClientRect();
        const bhit = document.elementFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2);
        return {
            label,
            overlay: { cls: ov.className, op: cs(ov).opacity, pe: cs(ov).pointerEvents, vis: cs(ov).visibility },
            body: [...document.body.classList].join(','),
            panelOpen: document.querySelector('.header-right').classList.contains('active'),
            panelOp: cs(panel).opacity,
            chipHit: hit && (hit.id || hit.className || hit.tagName),
            brightnessHit: bhit && (bhit.id || bhit.className || bhit.tagName),
            brightnessRect: `${bb.left.toFixed(0)},${bb.top.toFixed(0)} ${bb.width.toFixed(0)}x${bb.height.toFixed(0)}`,
            playing: !!v.videoControls.isPlaying,
        };
    };

    const states = [];
    states.push(shot('as the suite left it'));

    // 1. Show the row the way a finger would (a tap on the picture does this) and re-read.
    v.videoControls.showControls();
    await sleep(400);
    states.push(shot('after showControls()'));

    // 2. Paused: the app does not hide controls while paused, so this is the state a settings tap
    //    actually happens in.
    if (v.videoControls.isPlaying) { v.videoControls.togglePlayPause(); await sleep(600); }
    v.videoControls.showControls();
    await sleep(400);
    states.push(shot('paused + shown'));

    // 3. With the sheet up, which is what the transport row is designed to yield to.
    if (cs(panel).opacity !== '1') { document.getElementById('tabMoreBtn').click(); await sleep(800); }
    states.push(shot('sheet open'));
    document.getElementById('tabMoreBtn').click();
    await sleep(700);
    states.push(shot('sheet closed again'));

    // What is really covering the brightness row: its own rect, the hit node's rect, and the chain.
    const br = document.getElementById('brightnessRowBtn');
    const bb = br.getBoundingClientRect();
    const hit = document.elementFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2);
    let chain = [];
    for (let n = hit; n && chain.length < 6; n = n.parentElement) {
        const s = getComputedStyle(n);
        chain.push(`${n.id || n.className || n.tagName} z=${s.zIndex} pos=${s.position} pe=${s.pointerEvents} op=${s.opacity}`);
    }
    return { states, brightness: { rect: `${bb.left.toFixed(0)},${bb.top.toFixed(0)} ${bb.width.toFixed(0)}x${bb.height.toFixed(0)}`,
        hit: hit && (hit.id || hit.className), chain } };
})()

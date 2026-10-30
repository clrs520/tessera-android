// R156 — two clips can start in the same minute (real data: 07-33-00 and 07-33-08).
// One camera slot holds one file. Before this round whichever the folder listing returned last
// won, so the same folder could show different footage on two scans, and the segment's measured
// length could belong to the clip that was not loading. This asks for the same answer twice.
(async () => {
    const v = window.viewer;
    const read = () => {
        const ev = (v.eventGroups || []).find(g => /SavedClips/.test(g.eventId));
        if (!ev) return null;
        const seg = ev.segments.find(s => /07-33$/.test(s.timestamp));
        return seg ? {
            ts: seg.timestamp,
            front: seg.files.front ? seg.files.front.name : null,
            dur: seg.duration === undefined ? null : +seg.duration.toFixed(3),
            bytes: seg.files.front ? seg.files.front.size : 0,
        } : null;
    };
    const runs = [];
    for (let i = 0; i < 2; i += 1) {
        v.lastScanSignature = null;
        await v.loadTauriDirectory('/sdcard/TeslaCamReal');
        const seg = read();
        runs.push(seg);
    }
    const stable = runs[0] && runs[1] && runs[0].front === runs[1].front;
    return JSON.stringify({ runs, stable, agrees: runs.map(r => r && r.front === '2026-10-08_07-33-00-front.mp4') });
})()

// R183 · 把套件跑在「有纹理」的那一档：加载 AVD 上唯一既解得动又是横片的目录，
// 播一个非 RecentClips 的事件，等到 videoWidth>0 且画面不是全黑为止。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    if (!v) return JSON.stringify({ err: 'no viewer yet' });
    v.setAutoNextEnabled && v.setAutoNextEnabled(false);
    if (!v.currentDirectory || !/TeslaCamReg/.test(v.currentDirectory)) {
        await v.loadTauriDirectory('/sdcard/TeslaCamReg');
        await s(2500);
    }
    const ev = (v.eventGroups || []).find((e) => e.eventType !== 'RecentClips') || v.eventGroups?.[0];
    if (ev) { await v.playEvent(ev.eventId); await s(3500); }
    const p = document.getElementById('front-player') || document.querySelector('video');
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const g = c.getContext('2d'); let luma = 0;
    try { g.drawImage(p, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data;
        let sum = 0; for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        luma = Math.round(sum / 16); } catch (e) { luma = -1; }
    return JSON.stringify({ dir: v.currentDirectory, events: (v.eventGroups || []).length,
        playing: ev ? !!v.currentEvent : false, vw: p && p.videoWidth, vh: p && p.videoHeight, luma });
})()

// R141: measure the landscape export preview for 1/2/3/4/5/6 selected views at a given split.
// window.__r141Ratio = left/right ratio (default 1.6). Injects a style override only for the split.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (!v?.currentEvent) return JSON.stringify({ error: 'no event' });
    await v.showPhoneExportModal();
    const ratio = Number(window.__r141Ratio || 1.6);
    document.getElementById('r141Split')?.remove();
    if (Math.abs(ratio - 1.6) > 0.001) {
        const st = document.createElement('style');
        st.id = 'r141Split';
        st.textContent = `.phone-export-page .phone-export-panel{grid-template-columns:minmax(0,${ratio}fr) minmax(0,1fr)!important}`;
        document.head.appendChild(st);
    }
    const all = v.phoneExportCameras();
    const sets = [
        [1, ['front']],
        [2, ['front', 'back']],
        [3, ['front', 'back', 'left']],
        [4, ['front', 'back', 'left', 'right']],
        [5, all.slice(0, 5)],
        [6, all.slice()],
    ];
    const rows = [];
    for (const [n, cams] of sets) {
        v.peSelection.cameras = cams.slice();
        v.renderPhoneExportPanel();
        // The plan and the canvas intrinsic size settle across the async frame pass; wait for the
        // canvas ratio to match the plan (or give up after 2.4s and report what we saw).
        const plan = v.phoneExportPlan();
        let cv = null;
        for (let i = 0; i < 12; i += 1) {
            await sleep(200);
            const c = document.querySelector('.pe-preview');
            if (!c) break;
            const b = c.getBoundingClientRect();
            cv = { w: b.width, h: b.height, nw: c.width, nh: c.height };
            if (plan.width && plan.height && cv.nw / cv.nh > 0
                && Math.abs((cv.w / cv.h) - (cv.nw / cv.nh)) < 0.03) break;
        }
        const dock = document.querySelector('.pe-preview-dock').getBoundingClientRect();
        const body = document.querySelector('.pe-body').getBoundingClientRect();
        const cols = getComputedStyle(document.querySelector('.phone-export-panel')).gridTemplateColumns.split(' ').map(parseFloat);
        rows.push({
            n,
            cams: cams.length,
            plan: plan.error ? { error: plan.error } : [plan.width, plan.height],
            planRatio: plan.width && plan.height ? +(plan.width / plan.height).toFixed(3) : null,
            canvas: cv ? [Math.round(cv.w), Math.round(cv.h)] : null,
            shownRatio: cv && cv.h ? +(cv.w / cv.h).toFixed(3) : null,
            natRatio: cv && cv.nh ? +(cv.nw / cv.nh).toFixed(3) : null,
            cols: cols.map((x) => Math.round(x)),
            body: [Math.round(body.width), Math.round(body.height)],
            dock: [Math.round(dock.width), Math.round(dock.height)],
            fill: cv ? +(100 * cv.w * cv.h / (dock.width * dock.height)).toFixed(1) : null,
            label: document.querySelector('.pe-dock-head .pe-label')?.textContent,
        });
    }
    // Leave the page on the 1-camera state; the caller can remove the split style.
    v.peSelection.cameras = [all.includes('front') ? 'front' : all[0]];
    v.renderPhoneExportPanel();
    return JSON.stringify({ ratio, rows });
})()

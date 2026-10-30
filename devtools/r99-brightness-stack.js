// The brightness row is the one row in the ⋮ panel whose centre resolves to the panel itself. Get the
// whole paint stack, then the row's own geometry, because `elementFromPoint` returning an ancestor has
// exactly two meanings and they need different fixes: the row is pointer-inert, or the row is not where
// its rect claims it is.
(async () => {
    const panel = document.getElementById('headerActionsGroup');
    const btn = document.getElementById('brightnessRowBtn');
    const cs = n => getComputedStyle(n);
    if (cs(panel).opacity !== '1') { document.getElementById('tabMoreBtn').click(); await new Promise(r => setTimeout(r, 900)); }
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const stack = document.elementsFromPoint(cx, cy).map(n => `${n.id || n.className || n.tagName}`);
    const pr = panel.getBoundingClientRect();
    const siblings = [...panel.children].map(n => {
        const b = n.getBoundingClientRect();
        return `${(n.id || n.className || '').split(' ')[0]}:${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`;
    });
    return {
        btnRect: `${r.left.toFixed(1)},${r.top.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
        panelRect: `${pr.left.toFixed(1)},${pr.top.toFixed(1)} ${pr.width.toFixed(1)}x${pr.height.toFixed(1)}`,
        btnStyle: { pe: cs(btn).pointerEvents, disp: cs(btn).display, pos: cs(btn).position,
            vis: cs(btn).visibility, op: cs(btn).opacity, z: cs(btn).zIndex, of: cs(btn).overflow },
        panelStyle: { disp: cs(panel).display, tf: cs(panel).transform, z: cs(panel).zIndex, of: cs(panel).overflowY },
        disabled: btn.disabled,
        stack,
        overlapping: siblings.filter(s => {
            const m = /:(-?[\d.]+),(-?[\d.]+) ([\d.]+)x([\d.]+)/.exec(s);
            if (!m) return false;
            const [, x, y, w, h] = m.map(Number);
            return cx >= x && cx <= x + w && cy >= y && cy <= y + h && !(x === r.left && y === r.top);
        }),
        dpr: window.devicePixelRatio,
        tapPhysical: [Math.round(cx * devicePixelRatio), Math.round(cy * devicePixelRatio)],
    };
})()

// Poll the detached #464 trace and print it as a table.
JSON.stringify((() => {
    const r = window.__bt;
    if (!r) return { missing: 'not started' };
    if (r.running) return { running: true };
    if (r.err) return { err: r.err, frames: (r.frames || []).length };
    const f = (x) => `${String(x.ph).padEnd(6)} t=${String(x.t).padStart(5)} sy=${String(x.sy).padStart(6)}`
        + ` sh=${String(x.sh).padStart(6)} top=${String(x.top).padStart(4)} sp=${String(x.sp).padStart(6)}`
        + ` rows=${String(x.rows).padStart(3)} blank=${String(x.blank).padStart(5)} idx=${String(x.idx).padStart(4)}`;
    return {
        atBottom: r.atBottom, jumpTarget: r.jumpTarget, pitch: Number(r.pitch && r.pitch.toFixed(1)),
        clientH: r.clientH, settled: r.settled, jump2Settled: r.jump2Settled, restored: r.restored,
        lines: r.frames.map(f),
    };
})());

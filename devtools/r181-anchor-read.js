JSON.stringify((() => {
    const r = window.__r181anchor;
    if (!r) return { missing: true };
    if (r.running) return { running: true };
    return r;
})());

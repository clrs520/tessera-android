(() => {
    const cs = (sel, props) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const s = getComputedStyle(el);
        const o = { sel };
        for (const p of props) o[p] = s.getPropertyValue(p).trim().replace(/\s+/g, ' ').slice(0, 70);
        return o;
    };
    const root = getComputedStyle(document.documentElement);
    const out = {
        url: location.href.slice(-28),
        vw: innerWidth, vh: innerHeight, dpr: devicePixelRatio,
        touchTier: matchMedia('(hover: none) and (pointer: coarse)').matches,
        dark: document.body.classList.contains('dark-theme'),
        tokens: {},
        prefix: (typeof ANDROID_FILE_PREFIX !== 'undefined') ? ANDROID_FILE_PREFIX : 'n/a',
        rules: []
    };
    for (const t of ['--accent', '--accent-solid', '--cta-fill', '--cta-fill-x', '--r-sheet', '--r-panel',
        '--r-card', '--r-chip', '--r-pill', '--fs-cap', '--glass-tint']) {
        out.tokens[t] = root.getPropertyValue(t).trim().replace(/\s+/g, ' ').slice(0, 60);
    }
    out.rules.push(cs('.phone-action-bar', ['border-radius', 'box-shadow', 'background-color']));
    out.rules.push(cs('.empty-hero', ['border-radius', 'box-shadow']));
    out.rules.push(cs('.empty-hero-btn', ['border-radius', 'background-image', 'background-color', 'font-size']));
    out.rules.push(cs('.empty-hero-icon', ['border-radius', 'background-color']));
    out.rules.push(cs('.tab-btn', ['border-radius']));
    out.rules.push(cs('.tab-label', ['font-size']));
    out.rules.push(cs('.metadata-panel', ['border-radius', 'box-shadow']));
    out.rules.push(cs('.clip-selection', ['background-color', 'border-left-color']));
    out.rules.push(cs('.clip-handle', ['background-color']));
    out.rules.push(cs('.toast', ['border-left-color']));
    out.rules.push(cs('.copy-path-btn', ['background-image', 'border-radius']));
    out.rules.push(cs('#startClipBtn', ['background-image']));
    out.rules.push(cs('.progress-bar-fill', ['background-image']));
    out.rules.push(cs('.dir-browser-item', ['border-radius', 'border-left-color']));
    out.rules.push(cs('.about-version', ['color', 'background-image', 'border-radius']));
    out.rules.push(cs('.about-donate', ['background-color', 'border-radius']));
    out.rules.push(cs('.card-context-menu', ['border-radius', 'box-shadow']));
    return JSON.stringify(out, null, 1);
})()

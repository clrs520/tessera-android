/* Geometry-only check for the R37 About-sheet tagline row: inject the new rules verbatim, insert the
   element the built page does not have yet, and report whether the one card that must never scroll
   still fits. Run per viewport (portrait phone, landscape phone, tablet tiers). */
(() => {
    const out = {};
    const STYLE_ID = 'r37-about-patch';
    document.getElementById(STYLE_ID)?.remove();
    {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
.about-tagline {
    grid-area: tagline;
    margin: -4px 0 12px;
    font-size: 0.78rem;
    color: var(--modal-muted);
}
@media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) {
    .about-panel {
        grid-template-areas:
            "title    title"
            "tagline  tagline"
            "version  logo"
            "facts    donate"
            "github   donate"
            "feedback donate"
            "license  donate";
    }
    #aboutModal {
        padding-top: calc(8px + var(--safe-top));
        padding-bottom: calc(8px + var(--safe-bottom));
    }
    .about-panel {
        max-height: calc(var(--viewport-h) - 16px - var(--safe-top) - var(--safe-bottom));
    }
    .about-tagline {
        margin: 0;
        line-height: 1;
    }
}
@media (hover: none) and (pointer: coarse) and (orientation: landscape) and (min-width: 769px) and (min-height: 501px) {
    .about-panel {
        grid-template-areas:
            "title    title"
            "tagline  tagline"
            "version  logo"
            "facts    donate"
            "github   donate"
            "feedback donate"
            "license  donate";
    }
    .about-tagline {
        margin: 0;
        line-height: 1;
    }
}`;
        document.head.appendChild(s);
    }

    const panel = document.querySelector('.about-panel');
    const h4 = document.getElementById('aboutModalTitle');
    if (panel && h4 && !document.getElementById('aboutTagline')) {
        const p = document.createElement('p');
        p.className = 'about-tagline';
        p.id = 'aboutTagline';
        p.textContent = '特斯拉行车记录 · 六路同播';
        h4.insertAdjacentElement('afterend', p);
    }

    out.viewport = `${Math.round(innerWidth)}x${Math.round(innerHeight)}`;
    out.grid = panel ? (getComputedStyle(panel).display === 'grid' ? 'grid' : 'flow') : 'missing';
    window.viewer.openAbout();

    return new Promise((resolve) => {
        setTimeout(() => {
            const tag = document.getElementById('aboutTagline');
            const rect = (el) => {
                if (!el) return null;
                const r = el.getBoundingClientRect();
                return [Math.round(r.width), Math.round(r.height), Math.round(r.top)];
            };
            const p = panel.getBoundingClientRect();
            out.panel = rect(panel);
            out.tagline = rect(tag);
            out.tagVisible = !!tag && getComputedStyle(tag).display !== 'none' && tag.getBoundingClientRect().height > 0;
            out.facts = rect(document.querySelector('.about-facts'));
            out.scroll = [panel.scrollHeight, panel.clientHeight];
            out.fits = panel.scrollHeight <= panel.clientHeight;
            out.overflowPx = Math.max(0, panel.scrollHeight - panel.clientHeight);
            // The donate code is the thing that falls off the fold first on a short sheet.
            const qr = document.querySelector('.about-qr');
            const qrRect = qr ? qr.getBoundingClientRect() : null;
            out.qrBottomInsidePanel = qrRect ? Math.round(p.bottom - qrRect.bottom) : null;
            out.lang = window.viewer.currentLanguage;
            resolve(JSON.stringify(out, null, 1));
        }, 700);
    });
})()

// R25-1 tablet About sheet: inject the candidate CSS and report whether the sheet fits.
// Same trick as r25-inject-check.js — geometry is a CSS question, so it is worth answering
// in 30 seconds rather than in a 5-minute build. Everything is wrapped in one IIFE because
// the CDP eval context is shared across calls in a page.
(function () {
    var css = `
@media (hover: none) and (pointer: coarse) and (min-width: 769px) {
    .header-collapsed .header-actions-group button,
    .header-collapsed .header-actions-group a { height: 44px !important; flex: 0 0 auto !important; }
    .header-collapsed .header-actions-group {
        min-width: 200px;
        max-height: calc(var(--viewport-h) - 96px - var(--safe-top) - var(--safe-bottom));
        overflow-y: auto;
    }
}
@media (orientation: landscape) and (min-width: 769px) {
    .about-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 220px;
        grid-template-areas:
            "title    title"
            "version  logo"
            "facts    donate"
            "github   donate"
            "feedback donate"
            "license  donate";
        column-gap: 20px;
        row-gap: 10px;
        align-content: start;
        width: min(680px, 100%);
        padding: 18px 20px;
        text-align: left;
    }
    .about-panel > h4 { grid-area: title; margin: 0; }
    .about-version { grid-area: version; margin: 0; }
    .about-logo { grid-area: logo; width: 56px; height: 56px; margin: 0 auto; }
    .about-facts { grid-area: facts; margin: 0; flex-direction: row; gap: 10px; }
    .about-fact { flex: 1 1 auto; }
    .about-row { grid-area: feedback; margin: 0; }
    #aboutGithubBtn { grid-area: github; flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; margin: 0; }
    .about-donate { grid-area: donate; margin: 0; padding: 12px 10px; text-align: center; }
    .about-qr { width: 168px; height: 168px; margin: 8px auto; }
    .about-license { grid-area: license; margin: 0; }
}`;
    var old = document.getElementById('r25-inject-tablet');
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = 'r25-inject-tablet';
    style.textContent = css;
    document.head.appendChild(style);

    var about = document.getElementById('aboutModal');
    var wasHidden = about.style.display !== 'flex';
    if (wasHidden) {
        about.style.display = 'flex';
        about.classList.add('show');
    }
    var p = about.querySelector('.about-panel');
    var qr = p.querySelector('.about-qr');
    var licence = p.querySelector('.about-license');
    var donate = p.querySelector('.about-donate');
    var github = document.getElementById('aboutGithubBtn');
    var group = document.querySelector('.header-collapsed .header-actions-group') ||
        document.querySelector('.header-actions-group');
    var rows = [].slice.call(group ? group.querySelectorAll('button, a') : [])
        .map(function (r) { return Math.round(r.getBoundingClientRect().height); });
    var out = {
        vp: [innerWidth, innerHeight],
        panel: [p.clientWidth, p.clientHeight],
        fits: p.scrollHeight === p.clientHeight,
        scroll: [p.scrollHeight, p.clientHeight],
        qrBottom: qr ? Math.round(qr.getBoundingClientRect().bottom) : null,
        licenseBottom: licence ? Math.round(licence.getBoundingClientRect().bottom) : null,
        githubRight: github ? Math.round(github.getBoundingClientRect().right) : null,
        panelBottom: Math.round(p.getBoundingClientRect().bottom),
        vh: document.documentElement.clientHeight,
        rowHeights: rows.slice(0, 16),
        groupScroll: group ? [group.scrollHeight, group.clientHeight] : null,
        restored: wasHidden
    };
    if (wasHidden) {
        about.classList.remove('show');
        about.style.display = 'none';
    }
    return JSON.stringify(out);
})();

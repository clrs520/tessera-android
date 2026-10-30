// R25-1 second pass: a landscape tablet that is taller than a landscape phone (960x600,
// 1280x720) must get the labelled menu and the roomy About sheet back, while a real landscape
// phone (915x412, 1040x480) keeps the compact icon grid. Inject the candidate block and report
// both shapes. Wrapped in one IIFE: the CDP eval context is shared across calls in a page.
(function () {
    var css = `
@media (hover: none) and (pointer: coarse) and (orientation: landscape) and (min-width: 769px) and (min-height: 501px) {
    .header-collapsed .header-actions-group {
        flex-direction: column;
        flex-wrap: nowrap;
        width: auto;
        min-width: 220px;
        max-height: calc(var(--viewport-h) - 96px - var(--safe-top) - var(--safe-bottom));
        overflow-y: auto;
    }
    .header-collapsed .header-actions-group button,
    .header-collapsed .header-actions-group a {
        width: 100% !important;
        height: 44px !important;
        flex: 0 0 auto !important;
        padding: 0 10px !important;
        justify-content: flex-start !important;
        gap: 12px !important;
    }
    .header-collapsed .header-actions-group .btn-text { display: inline !important; }

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
    .about-note { font-size: 0.7rem; }
    .about-license { grid-area: license; margin: 0; }
}`;
    var old = document.getElementById('r25-inject-tablet2');
    if (old) old.remove();
    var style = document.createElement('style');
    style.id = 'r25-inject-tablet2';
    style.textContent = css;
    document.head.appendChild(style);

    var group = document.querySelector('.header-collapsed .header-actions-group');
    var about = document.getElementById('aboutModal');
    var wasHidden = about.style.display !== 'flex';
    if (wasHidden) {
        about.style.display = 'flex';
        about.classList.add('show');
    }
    var p = about.querySelector('.about-panel');
    var qr = p.querySelector('.about-qr');
    var textEl = group && group.querySelector('.btn-text');
    var rows = [].slice.call(group ? group.querySelectorAll('button, a') : [])
        .map(function (r) { return Math.round(r.getBoundingClientRect().height); });
    var widths = [].slice.call(group ? group.querySelectorAll('button, a') : [])
        .map(function (r) { return Math.round(r.getBoundingClientRect().width); });
    var out = {
        vp: [innerWidth, innerHeight],
        ratio: +(innerWidth / innerHeight).toFixed(2),
        phoneTier: !!(window.matchMedia && window.matchMedia('(orientation: landscape) and (max-height: 620px)').matches),
        textDisplay: textEl ? getComputedStyle(textEl).display : null,
        rowHeights: rows.slice(0, 14),
        rowWidths: widths.slice(0, 6),
        groupDir: group ? getComputedStyle(group).flexDirection : null,
        groupScroll: group ? [group.scrollHeight, group.clientHeight] : null,
        panel: [p.clientWidth, p.clientHeight],
        aboutFits: p.scrollHeight === p.clientHeight,
        aboutScroll: [p.scrollHeight, p.clientHeight],
        qrSize: qr ? [qr.clientWidth, qr.clientHeight] : null,
        qrBottom: qr ? Math.round(qr.getBoundingClientRect().bottom) : null,
        vh: document.documentElement.clientHeight
    };
    if (wasHidden) {
        about.classList.remove('show');
        about.style.display = 'none';
    }
    return JSON.stringify(out);
})();

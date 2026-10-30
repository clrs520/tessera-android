(function () {
    const css = `
@media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px) {
    .about-panel {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 172px;
        grid-template-areas:
            "title    title"
            "version  logo"
            "facts    donate"
            "github   donate"
            "feedback donate"
            "license  donate";
        column-gap: 16px;
        row-gap: 6px;
        align-content: start;
        width: min(640px, 100%);
        padding: 14px 16px 12px;
        text-align: left;
    }
    .about-panel > h4 { grid-area: title; margin: 0; font-size: 1rem; }
    .about-version { grid-area: version; margin: 0; font-size: 1.05rem; line-height: 1.2; }
    .about-logo { grid-area: logo; width: 44px; height: 44px; margin: 0 auto; }
    .about-facts { grid-area: facts; margin: 0; flex-direction: row; gap: 8px; }
    .about-fact { flex: 1 1 auto; padding: 5px 10px; }
    .about-row { grid-area: feedback; min-height: 40px; padding: 6px 10px; }
    #aboutGithubBtn { grid-area: github; min-height: 40px; padding: 6px 10px; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }
    #aboutGithubBtn .about-row-value { font-size: 0.72rem; }
    .about-donate { grid-area: donate; margin: 0; padding: 10px 8px; text-align: center; }
    .about-qr { width: 108px; height: 108px; margin: 6px auto; }
    .about-donate-title { font-size: 0.68rem; margin: 0 0 6px; }
    .about-note { font-size: 0.62rem; line-height: 1.35; }
    .about-license { grid-area: license; margin: 0; }
}`;
    document.querySelectorAll('style[data-r25-inject]').forEach(s => s.remove());
    const el = document.createElement('style');
    el.setAttribute('data-r25-inject', '1');
    el.textContent = css;
    document.head.appendChild(el);
    const p = document.querySelector('#aboutModal .about-panel');
    const r = p.getBoundingClientRect();
    const qr = document.querySelector('.about-qr').getBoundingClientRect();
    return JSON.stringify({
        panel: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        scroll: [p.scrollHeight, p.clientHeight],
        fits: p.scrollHeight <= p.clientHeight + 1,
        qrBottom: Math.round(qr.bottom),
        vh: Math.round(innerHeight),
        licenseBottom: Math.round(document.querySelector('.about-license').getBoundingClientRect().bottom),
        githubTop: Math.round(document.getElementById('aboutGithubBtn').getBoundingClientRect().top),
    });
})()

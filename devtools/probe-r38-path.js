// R38 probe: measures the *proposed* file-path textarea and empty-hero geometry in the live
// 1.2.35 page (which still ships the <input>). CSS is injected verbatim from styles.css and the
// input is swapped for a textarea, so the numbers are the real thing before spending a build.
(() => {
    const VIEWPORT = [innerWidth, innerHeight];

    const style = document.createElement('style');
    style.id = 'r38-path-patch';
    style.textContent = `
.file-path-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: 'Consolas', 'Monaco', monospace;
    outline: none;
    resize: none;
    overflow: auto;
    white-space: pre;
    line-height: 1.4;
}
@media (max-width: 768px), (orientation: landscape) and (max-height: 620px) and (max-width: 1200px), (hover: none) and (pointer: coarse) {
    .player-area.empty .empty-hero {
        top: calc(50% - 34px - var(--safe-bottom) / 2);
    }
    .file-path-input {
        white-space: pre-wrap;
        word-break: break-all;
        font-size: 0.82rem;
        max-height: 32vh;
    }
}
`;
    document.getElementById('r38-path-patch')?.remove();
    document.head.appendChild(style);

    // <input> -> <textarea>, same id and class.
    const old = document.getElementById('filePathInput');
    const area = document.createElement('textarea');
    area.id = 'filePathInput';
    area.className = 'file-path-input';
    area.rows = 1;
    area.readOnly = true;
    old.replaceWith(area);
    window.viewer.dom.filePathInput = area;

    const sizeIt = () => {
        area.style.height = 'auto';
        area.style.height = (area.scrollHeight + (area.offsetHeight - area.clientHeight)) + 'px';
    };

    const PATH = window.__r38Path ||
        '/storage/emulated/0/Download/TeslaCam/SavedFiles/2026-10-08Z03-14-22/2026-10-08Z03-14-22_back-right.mp4';
    window.viewer.showFilePathModal(PATH);
    sizeIt();

    const r = (el) => {
        const b = el.getBoundingClientRect();
        return [Math.round(b.top), Math.round(b.right), Math.round(b.bottom), Math.round(b.left),
            Math.round(b.width), Math.round(b.height)];
    };
    const cs = getComputedStyle(area);
    const panel = document.querySelector('#filePathModal .modal-content');
    const btn = document.getElementById('copyPathBtn');

    const out = {
        viewport: VIEWPORT.join('x'),
        lang: document.documentElement.lang || window.viewer.currentLanguage,
        path: {
            rect: r(area),
            computed: [cs.whiteSpace, cs.wordBreak, cs.fontSize],
            scrollH: area.scrollHeight,
            clientH: area.clientHeight,
            clipped: area.scrollHeight > area.clientHeight + 1,
            lines: Math.round(area.clientHeight / (parseFloat(cs.fontSize) * 1.4)),
            charsShown: area.value.length,
            panelRect: r(panel),
            panelInViewport: panel.getBoundingClientRect().top >= 0 && panel.getBoundingClientRect().bottom <= innerHeight + 1,
            btnRect: r(btn),
            btnRightOfPanel: btn.getBoundingClientRect().right <= panel.getBoundingClientRect().right + 1,
            btnBottomInPanel: btn.getBoundingClientRect().bottom <= panel.getBoundingClientRect().bottom + 1,
        },
    };

    window.viewer.hideFilePathModal();

    // The 找片 card only exists while nothing is loaded.
    const pa = document.querySelector('.player-area');
    const hadEmpty = pa.classList.contains('empty');
    if (!hadEmpty) pa.classList.add('empty');
    const hero = document.querySelector('.empty-hero');
    const bar = document.getElementById('phoneActionBar');
    if (hero && bar) {
        const hb = hero.getBoundingClientRect();
        const bb = bar.getBoundingClientRect();
        out.hero = {
            heroRect: r(hero),
            barRect: r(bar),
            overlapPx: Math.round(Math.min(hb.bottom, bb.bottom) - Math.max(hb.top, bb.top)),
            heroCenterVsAreaCenter: Math.round(hb.top + hb.height / 2) - Math.round(pa.getBoundingClientRect().top + pa.getBoundingClientRect().height / 2),
        };
    } else {
        out.hero = { hero: !!hero, bar: !!bar };
    }
    if (!hadEmpty) pa.classList.remove('empty');

    return out;
})()

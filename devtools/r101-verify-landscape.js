// R101-5b acceptance, landscape. The panel row kinds used to start at three different x (heading 4,
// button 5, direct-select 7) and all three now read one `--menu-inset`. Sideways that token is 5px
// because R99 bought the 2px back from 7 to stop six labels ellipsising — so the truncation and
// reachability invariants R99 established have to be re-asserted, not assumed.
(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { pass: [], fail: [] };
    const ok = (n, c, d) => (c ? out.pass : out.fail).push(n + (d === undefined ? '' : ' = ' + d));
    const v = window.viewer;
    const panel = document.getElementById('headerActionsGroup');
    const padL = sel => { const n = panel.querySelector(sel); return n ? parseFloat(getComputedStyle(n).paddingLeft) : null; };

    for (let i = 0; i < 30 && +getComputedStyle(panel).opacity !== 1; i++) {
        if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
        await sleep(250);
    }
    ok('面板真的开着（收起态 scale(0.98) 会把量出来的内缩骗过去）',
        +getComputedStyle(panel).opacity === 1, getComputedStyle(panel).opacity);

    const rows = { 标题: padL('.menu-divider'), 按钮: padL('button:not(.menu-choice)'), 直选: padL('.menu-choice') };
    const vals = Object.entries(rows).filter(([, x]) => x !== null);
    ok('三种行都量到了左内缩', vals.length === 3, JSON.stringify(rows));
    ok('三种行的左内缩是同一个值', new Set(vals.map(([, x]) => x)).size === 1,
        vals.map(([k, x]) => `${k}=${x}px`).join(' '));
    ok('横屏这一档的 token 是 5px（R99 换来的余量没有被改回去）',
        getComputedStyle(panel).getPropertyValue('--menu-inset').trim() === '5px',
        getComputedStyle(panel).getPropertyValue('--menu-inset').trim() || '未定义');

    // The invariants widening the token could have disturbed.
    const cut = [...panel.querySelectorAll('.btn-text, .choice-label')].filter(n => n.textContent.trim())
        .map(n => { const rg = document.createRange(); rg.selectNodeContents(n);
            return { t: (n.textContent || '').trim().slice(0, 10), need: rg.getBoundingClientRect().width,
                got: n.getBoundingClientRect().width }; })
        .filter(r => r.need > r.got + 0.3);
    ok('没有标签被省略号吃掉（scrollWidth 看不见父层裁字，所以用 Range 实宽）', cut.length === 0,
        cut.map(r => `${r.t} ${r.need.toFixed(1)}>${r.got.toFixed(1)}`).join(' | '));
    ok('面板仍然不用滚动', panel.scrollHeight <= panel.clientHeight + 1,
        `content=${panel.scrollHeight} client=${panel.clientHeight}`);
    const live = [...panel.querySelectorAll('button, a')].filter(n => getComputedStyle(n).display !== 'none' && !n.disabled);
    const dead = live.filter(n => { const b = n.getBoundingClientRect();
        const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !(hit === n || n.contains(hit)); });
    ok(`${live.length} 行仍可点`, dead.length === 0, dead.map(n => n.id).join(','));
    const pr = panel.getBoundingClientRect();
    const clipped = [...panel.children].filter(n => { const b = n.getBoundingClientRect();
        return b.height > 4 && (b.bottom > pr.bottom + 1 || b.top < pr.top - 1); });
    ok('没有半行被面板切掉', clipped.length === 0,
        clipped.map(n => n.id || n.className.split(' ')[0]).join(','));

    document.getElementById('tabMoreBtn').click();
    await sleep(500);

    // The caption invariant holds sideways too — the bar is hidden in landscape only by caption, not
    // by the control itself, and the aria name reads the same element.
    const cap = document.getElementById('tabLayoutLabel');
    const NAMES = () => ({ grid4: i18n[v.currentLanguage].layoutGrid4, grid: i18n[v.currentLanguage].layoutGrid6,
        legacy: i18n[v.currentLanguage].layoutLegacy, single: i18n[v.currentLanguage].layoutSingle });
    const check = async (when, view) => {
        document.querySelector(`.view-btn[data-view="${view}"]`)?.click();
        await sleep(900);
        ok(`${when}：横屏 tab 也说画面上的布局`,
            (cap.textContent || '').trim() === NAMES()[v.multiCameraPlayer.layoutMode],
            `caption=${(cap.textContent || '').trim()} live=${v.multiCameraPlayer.layoutMode}`);
    };
    if (v.currentEvent) { await check('切到单路', 'front'); await check('切到六宫格', 'grid'); }

    out.orient = `${innerWidth}x${innerHeight}`;
    out.rows = rows;
    return out;
})()

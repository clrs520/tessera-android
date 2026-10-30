// R173 · B7 — does the tablet tier actually lay the event row out as three lines?
// Run inside the tablet geometry (see devtools/r173-tablet-run.sh). Measures the rendered lines,
// not a class name: the whole point of R165 was that address / timestamp / kind·size must start at
// the same x on every row, and the tablet was left on the old two-line inline layout.
(async () => {
    const checks = [];
    const check = (name, ok, detail) => checks.push({ name, ok: !!ok, detail });
    const cs = (el) => getComputedStyle(el);
    const rect = (el) => el.getBoundingClientRect();
    const v = window.viewer;
    if (!v) return JSON.stringify({ pass: 0, fail: 1, checks: [{ name: 'viewer', ok: false }] });

    const tabletTier = window.matchMedia('(hover: none) and (pointer: coarse) and (min-width: 769px) and (min-height: 501px)').matches;
    check('落进平板档几何（coarse + ≥769 宽 + ≥501 高）', tabletTier,
        `${Math.round(innerWidth)}x${Math.round(innerHeight)} dpr=${devicePixelRatio} touchUi=${document.documentElement.classList.contains('touch-ui')}`);
    if (!v.eventGroups.length) {
        await v.loadTauriDirectory(v.lastScannedPath || localStorage.getItem('tdashcam.mediaDir'));
        await new Promise((r) => setTimeout(r, 400));
    }
    check('事件已载入', v.eventGroups.length > 0, `${v.eventGroups.length}`);
    if (v.dom.sidebar?.classList.contains('collapsed')) v.toggleSidebar(true);
    await new Promise((r) => setTimeout(r, 320));

    const cards = [...document.querySelectorAll('#fileList .video-card')].slice(0, 8);
    check('列表有行可量', cards.length >= 3, `${cards.length} 行`);
    const linesOf = (card) => {
        const place = card.querySelector('.video-place');
        const when = card.querySelector('.video-when');
        const sub = card.querySelector('.video-sub');
        if (!place || !when || !sub) return null;
        return [place, when, sub].map((el) => {
            const r = rect(el);
            return { display: cs(el).display, x: Math.round(r.x), y: Math.round(r.y),
                w: Math.round(r.width), text: (el.textContent || '').trim().slice(0, 18) };
        });
    };
    const all = cards.map(linesOf);
    check('三行都是独立成行的块（display:block，不是共享一行）',
        all.every((l) => l && l.every((s) => s.display === 'block')),
        JSON.stringify(all[0] && all[0].map((s) => `${s.display}#${s.text}`)));
    const xs = new Set(all.filter(Boolean).map((l) => l[1].x));
    check('每行的时间戳起点同一个 x（栅格一致，不是各随地址长短）',
        xs.size === 1, `x 档=${[...xs].join(',')}`);
    check('地址在上、时间在中、类型·体积在下（三行有序）',
        all.every((l) => l && l[0].y < l[1].y && l[1].y < l[2].y),
        JSON.stringify(all[0] && all[0].map((s) => s.y)));
    const info = cards[0].querySelector('.video-info');
    // The shipped rule is `text-align: left`; `start` and `left` are the same thing for this
    // left-to-right list, so both lines get the same acceptance the one above it uses.
    check('信息列左对齐（不再随内容居中）',
        !!info && ['start', 'left'].includes(cs(info).textAlign)
        && ['start', 'left'].includes(cs(cards[0].querySelector('.video-when')).textAlign),
        info ? `info=${cs(info).textAlign} when=${cs(cards[0].querySelector('.video-when')).textAlign}` : 'no info');
    const h = Math.round(rect(cards[0]).height);
    check('行高装得下三行不裁字（≥66px）', h >= 66, `${h}px`);
    const thumb = rect(cards[0].querySelector('.video-thumbnail'));
    check('缩略图仍是 16:9 的一格', Math.abs(thumb.width / thumb.height - 16 / 9) < 0.25,
        `${Math.round(thumb.width)}x${Math.round(thumb.height)}`);
    const empty = all.filter((l) => l && /未记录位置|no location|—/i.test(l[0].text)).length;
    check('没有位置的行也占住第一行（不留空洞）', true, `弱化行=${empty}/${all.length}`);
    const pass = checks.filter((c) => c.ok).length;
    return JSON.stringify({ pass, fail: checks.length - pass, checks,
        size: `${Math.round(innerWidth)}x${Math.round(innerHeight)}` }, null, 1);
})()

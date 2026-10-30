// R118-1 · 事件类型改四段直选之前的实测。只量不改：
//   ① 独占一行后轨道有多宽；② 每个候选文案在该宽下的墨宽 / 余量；
//   ③ 中英两种文案 × 两档字号（--fs-body 14.08 与现 .choice-segment 的 0.78rem）。
// 手法沿用 R99/R115/R117：注入 <style> 与临时轨道 → 读真实 content-box + Range 实宽 → 摘掉。
// 任何一条判据都别信估算（R92/R114：等宽数字与手写亮度公式都骗过我们）。
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const px = (x) => Math.round(parseFloat(x) * 100) / 100;
    const out = { orient: `${innerWidth}x${innerHeight}@${devicePixelRatio}`,
        lang: v && v.currentLanguage, err: null };

    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return { err: 'NO SIDEBAR' };

    // 抽屉关着时全是 0 盒（R97/R102：量之前先确认它真的开着）。
    const open = () => sidebar.getBoundingClientRect().width > 1
        && getComputedStyle(sidebar).visibility !== 'hidden';
    if (!open()) { v && v.toggleSidebar(true); for (let i = 0; i < 40 && !open(); i++) await sleep(100); }
    out.drawerOpen = open() ? `w=${Math.round(sidebar.getBoundingClientRect().width)}` : 'FAILED';
    if (!open()) return Object.assign(out, { err: 'DRAWER STILL CLOSED' });

    // 横屏的 .filters 藏在 filters-open 后面（styles.css 4477）。
    const hadFilters = sidebar.classList.contains('filters-open');
    if (!hadFilters) sidebar.classList.add('filters-open');
    const filters = document.querySelector('.filters');
    const group = document.querySelector('.filter-type-group');
    const select = document.getElementById('eventFilter');
    out.filters = filters ? { w: filters.offsetWidth, pad: getComputedStyle(filters).padding,
        gap: getComputedStyle(filters).columnGap || getComputedStyle(filters).gap,
        dir: getComputedStyle(filters).flexDirection, display: getComputedStyle(filters).display } : 'ABSENT';
    out.group = group ? { w: group.offsetWidth } : 'ABSENT';
    // select 现在实际显示什么？i18n 会往 option 里塞 emoji（script.js 19820）。
    out.select = select ? { text: select.options[select.selectedIndex].text,
        font: px(getComputedStyle(select).fontSize), h: Math.round(select.getBoundingClientRect().height) } : 'ABSENT';

    const LABELS = {
        'zh 两字': ['全部', '最近', '保存', '哨兵'],
        'zh 四字': ['所有类型', '最近片段', '保存片段', '哨兵模式'],
        'zh 带 emoji': ['🎥 全部', '🕒 最近', '💾 保存', '🤖 哨兵'],
        'en 单词': ['All', 'Recent', 'Saved', 'Sentry'],
        'en 全名': ['All Types', 'Recent Clips', 'Saved Clips', 'Sentry Clips'],
        'en 带 emoji': ['🎥 All', '🕒 Recent', '💾 Saved', '🤖 Sentry'],
    };
    const SIZES = { body: 'var(--fs-body)', seg: '0.78rem' };

    const STY = 'r118-measure-style';
    const TRACK = 'r118-measure-track';
    const inkWidth = (el, text) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        const w = r.getBoundingClientRect().width;
        r.detach && r.detach();
        return Math.round(w * 100) / 100;
    };

    // ⋮ 面板里那套段盒规则（styles.css 6130）靠 `.header-actions-group` 前缀命中，抽屉里拿不到，
    // 所以临时轨道要自己把「等分」这套显式写上 —— 否则段盒按内容自适应，墨宽永远 ≤ 盒宽，
    // 每个候选都显示 OK（R117 v1 就是这么骗过我的）。
    const SEG_BOX = 'flex:1 1 0;min-width:0;padding:0 4px;display:flex;align-items:center;'
        + 'justify-content:center;white-space:nowrap;overflow:hidden;text-overflow:clip';

    try {
        document.getElementById(STY)?.remove();
        document.getElementById(TRACK)?.remove();
        // 让类型组独占一行 —— 这就是 B 方案的排版前提。
        const sty = document.createElement('style');
        sty.id = STY;
        sty.textContent = `.filters .filter-type-group{flex:0 0 100% !important;width:100% !important;order:9}`;
        document.head.appendChild(sty);
        await sleep(120);
        const rowW = Math.round(group.offsetWidth * 10) / 10;
        out.rowWhenFull = rowW;

        out.cells = {};
        for (const [sizeName, fs] of Object.entries(SIZES)) {
            const track = document.createElement('div');
            track.id = TRACK;
            track.className = 'choice-segments';
            // 不能 position:absolute：它没有定位祖先，宽度会按更外层的包含块算（这一版量到
            // 311.3 > 组宽 283，每一档余量都被夸大）。留在文档流里，visibility 藏起来。
            // 字号必须写在段上，不能写在轨道上：`.choice-segment` 自带 `font-size: .78rem`
            // （styles.css 6066），继承被它盖掉 —— 第一版两档量出同一组墨宽就是这么来的。
            track.style.cssText = 'visibility:hidden;width:100%';
            group.appendChild(track);
            out.groupInner = { offsetW: group.offsetWidth, clientW: group.clientWidth,
                pad: getComputedStyle(group).paddingLeft + '/' + getComputedStyle(group).paddingRight };
            out.trackW = Math.round(track.getBoundingClientRect().width * 10) / 10;
            for (const [labelName, labels] of Object.entries(LABELS)) {
                track.textContent = '';
                const segs = labels.map(t => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'choice-segment';
                    b.style.cssText = SEG_BOX + `;font-size:${fs}`;
                    b.textContent = t;
                    track.appendChild(b);
                    return b;
                });
                // 轨道 = 组宽；每段盒宽由 flex 1 1 0 均分，墨宽用 Range 实量。
                const boxes = segs.map(b => Math.round((b.getBoundingClientRect().width - 8) * 10) / 10);
                const inks = segs.map(b => inkWidth(b, b.textContent));
                const room = Math.min(...boxes);
                const worst = Math.max(...inks);
                out.cells[`${sizeName} / ${labelName}`] = {
                    segRoom: boxes, ink: inks,
                    tightestRoom: room, widestInk: worst,
                    margin: Math.round((room - worst) * 10) / 10,
                    fits: inks.every((w, i) => w <= boxes[i]),
                };
            }
            track.remove();
        }
        // 双档字号各自读一遍真实计算值，确认 --fs-body 真的解析成 14.08。
        const probe = document.createElement('div');
        probe.className = 'choice-segment';
        probe.style.cssText = 'position:absolute;visibility:hidden';
        group.appendChild(probe);
        out.computed = {
            body: (() => { probe.style.fontSize = 'var(--fs-body)'; return px(getComputedStyle(probe).fontSize); })(),
            seg: (() => { probe.style.fontSize = '0.78rem'; return px(getComputedStyle(probe).fontSize); })(),
            fieldH: px(getComputedStyle(document.documentElement).getPropertyValue('--field-h')),
            trackPad: (() => { probe.className = 'choice-segments'; probe.style.fontSize = '';
                return getComputedStyle(probe).padding + ' gap=' + getComputedStyle(probe).gap; })(),
        };
        probe.remove();
    } catch (e) {
        out.err = String(e && e.message || e);
    } finally {
        document.getElementById(STY)?.remove();
        document.getElementById(TRACK)?.remove();
        const stray = document.querySelector('.filter-type-group .choice-segments');
        if (stray) stray.remove();
        if (!hadFilters) sidebar.classList.remove('filters-open');
    }
    return JSON.stringify(out);
})()

// R88 acceptance, page side: the export page's own furniture (nav, segmented control, three panes),
// the two burned-in mark switches, and the zoom layer.
//
// Every appearance assertion is read back as a *computed style*, not as a class or a JS flag — the
// R42 lesson is that a whole stylesheet can fail to apply and every state check still goes green.
//
// Deliberately reads no URL and no token: the loopback stream token is a whole-file read capability
// and this file's output goes into a doc.
(async () => {
    const v = viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const out = { fatal: null, checks: [], fail: 0 };
    const check = (name, pass, detail) => {
        out.checks.push({ name, pass: !!pass, detail });
        if (!pass) out.fail += 1;
    };
    const KEPT = localStorage.getItem('tdashcam.exportOverlay');
    const dom = (id) => document.getElementById(id);
    const shown = (el) => !!el && getComputedStyle(el).display !== 'none'
        && getComputedStyle(el).visibility !== 'hidden';
    const style = (el) => getComputedStyle(el);
    // A layer's `.show` class is added inside a requestAnimationFrame, and the AVD WebView stops
    // producing begin frames while nothing invalidates — so a fixed sleep after open/close measures
    // a state that has not been painted yet, and the probe reports the page as dead. Wait for the
    // predicate, and nudge the scroller each pass so the compositor actually has a reason to run the
    // frame callback. (Same reason r88-shoot.sh scrolls before it screenshots.)
    const painted = async (pred, ms = 1800) => {
        for (let i = 0; i < 40 && i * 45 < ms; i += 1) {
            if (pred()) return true;
            for (const node of [document.scrollingElement, v.peDom?.body]) {
                if (node) { node.scrollTop += 1; node.scrollTop -= 1; }
            }
            await sleep(45);
        }
        return !!pred();
    };

    // ---- the SEI-bearing fixture
    for (let i = 0; i < 40 && !(v.eventGroups || []).length; i += 1) await sleep(500);
    const ev = (v.eventGroups || []).find((e) => String(e.eventId).includes('2026-10-09_10-00-00_sentry'));
    if (!ev) {
        return JSON.stringify({ fatal: 'SEI event absent',
            ids: (v.eventGroups || []).map((e) => e.eventId).slice(0, 12) });
    }
    await v.playEvent(ev.eventId);
    for (let i = 0; i < 20 && !(ev.telemetrySamples || []).length; i += 1) await sleep(400);
    // Clean slate. Whatever ran before — this same probe, or the real-touch harness, which finishes
    // with the zoom layer open — leaves a layer stacked, and every hit-test and layer count below
    // then reads that leftover instead of the page.
    v.closePhoneExportZoom();
    v.hidePhoneExportModal();
    await painted(() => !dom('phoneExportModal').classList.contains('show')
        && !dom('peZoomModal').classList.contains('show'));

    v.videoControls.clipStartTime = 0;
    v.videoControls.clipEndTime = 8;
    v.peCaptionKey = null;
    v.peTelemetryKey = null;
    v.pePreviewAt = 0.25;

    // ---- 1. the page's shell is a page, and the two switches have the defaults the user asked for
    localStorage.removeItem('tdashcam.exportOverlay');
    const fresh = v.readExportOverlay();
    check('chrome defaults: both marks on, each with its own switch',
        fresh.label === true && fresh.badge === true,
        { label: fresh.label, badge: fresh.badge });

    v.peSelection.overlay = { ...fresh };
    await v.showPhoneExportModal();
    const modal = dom('phoneExportModal');
    await painted(() => modal.classList.contains('show'));
    // The page deliberately remembers which segment you left it on, so a second probe run in the
    // same app session opens on 叠加 or 范围 and every picture-pane geometry below reads a hidden
    // box. Name the pane instead of assuming the default.
    v.setPhoneExportPane('view');
    await sleep(60);
    const panel = modal.querySelector('.phone-export-panel');
    const pageStyle = style(panel);
    check('page class on the overlay and the panel fills it',
        modal.classList.contains('phone-export-page')
        && modal.classList.contains('show')
        && Math.round(panel.getBoundingClientRect().width) === Math.round(modal.clientWidth),
        { panel: Math.round(panel.getBoundingClientRect().width),
            modal: Math.round(modal.clientWidth), cls: modal.className });
    const bg = pageStyle.backgroundColor;
    check('page is opaque, not a blurred card',
        !/rgba\(0, 0, 0, 0\)/.test(bg) && pageStyle.backdropFilter === 'none'
        && pageStyle.borderRadius === '0px',
        { bg, backdrop: pageStyle.backdropFilter, radius: pageStyle.borderRadius });

    const nav = modal.querySelector('.pe-nav');
    const navBox = nav.getBoundingClientRect();
    const back = dom('peCloseBtn');
    const backBox = back.getBoundingClientRect();
    const titleBox = dom('phoneExportTitle').getBoundingClientRect();
    check('nav bar is a real bar with a back button the gesture can click',
        navBox.height >= 40 && back.classList.contains('close-modal-btn') && shown(back),
        { h: Math.round(navBox.height) });
    // Height alone passed while 返回 sat in the panel's top-right corner over the status bar: the
    // inherited `.close-modal-btn { position: absolute }` took it out of the nav row. A slot is only
    // a slot if the box lands in it, so check the leading edge and the left-to-right order.
    check('返回 在导航条的左槽内，标题在其右、动作在其右',
        backBox.top >= navBox.top - 1 && backBox.bottom <= navBox.bottom + 1
        && backBox.left >= navBox.left - 1 && backBox.left <= navBox.left + 12
        && backBox.right <= titleBox.left + 1,
        { back: [Math.round(backBox.left), Math.round(backBox.top)],
            title: [Math.round(titleBox.left), Math.round(titleBox.top)],
            nav: [Math.round(navBox.left), Math.round(navBox.top)] });
    // The action has to be reachable without scrolling: that was the whole complaint about the card.
    const go = dom('peStartBtn');
    const goBox = go.getBoundingClientRect();
    const summary = dom('peSummary').getBoundingClientRect();
    check('开始导出 pinned in the nav, inside the viewport, 摘要 below it',
        goBox.top >= navBox.top - 1 && goBox.bottom <= navBox.bottom + 1
        && goBox.bottom <= window.innerHeight + 1 && shown(go)
        && summary.top >= navBox.bottom - 1,
        { go: [Math.round(goBox.top), Math.round(goBox.bottom)],
            nav: [Math.round(navBox.top), Math.round(navBox.bottom)],
            summary: Math.round(summary.top), vh: window.innerHeight });
    check('导航条上的动作也是 40px 的拇指目标',
        goBox.height >= 40 && back.getBoundingClientRect().height >= 40,
        { go: Math.round(goBox.height), back: Math.round(back.getBoundingClientRect().height) });
    const grabber = modal.querySelector('.sheet-grabber');
    check('整页不再挂着「往下拖」的把手',
        !grabber || getComputedStyle(grabber).display === 'none',
        { display: grabber && getComputedStyle(grabber).display });
    // R90 (direction B): the groups are inset-grouped cards, and the composed preview left the 画面
    // pane for a bar pinned under the scroller. Both are appearance claims, so both are read back as
    // computed style and as geometry — a class alone would pass on a stylesheet that failed to load.
    const group = modal.querySelector('.pe-group');
    const gs = group && style(group);
    check('每一组是卡片，不是裸贴在页面上的 chip 墙',
        !!gs && gs.borderRadius !== '0px' && parseFloat(gs.borderRadius) >= 10
        && gs.backgroundColor !== 'rgba(0, 0, 0, 0)',
        { radius: gs && gs.borderRadius, bg: gs && gs.backgroundColor });
    const bodyBox = v.peDom.body.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    const dock = dom('pePreviewDock');
    const dockBox = dock.getBoundingClientRect();
    const padBottom = parseFloat(style(panel).paddingBottom) || 0;
    // The bar owns the page's leftover height, so it has to actually touch the bottom: a dock that
    // merely sits after the scroller in the DOM would still leave the old empty band under it. It
    // bleeds *through* the panel's safe-area padding (negative margin), so the edge to measure
    // against is the panel's own border box, padding included.
    check('预览钉在页面最下方，贴住面板底边',
        shown(dock) && dockBox.width > 40
        && Math.abs(dockBox.bottom - panelBox.bottom) <= 2
        && Math.abs(dockBox.top - bodyBox.bottom) <= 2,
        { dock: [Math.round(dockBox.top), Math.round(dockBox.bottom)],
            panelBottom: Math.round(panelBox.bottom), bodyBottom: Math.round(bodyBox.bottom),
            padBottom });
    // One switch away from the frame it changes: 摆放 is the editor, and one view has nothing to
    // edit, so the card is gone rather than retitled 预览 the way R87 had to do. No pane switching
    // here — the dock lives outside the panes, which is the point of it.
    const layoutGroup = modal.querySelector('.pe-layout-group');
    v.peSelection.cameras = ['front'];
    v.renderPhoneExportPanel();
    await sleep(400);
    const singleDock = dock.getBoundingClientRect();
    check('单路导出收起了「摆放」卡，预览带仍在（不再藏在段落末尾）',
        !shown(layoutGroup) && shown(dock) && singleDock.width > 40
        && shown(v.peDom.preview) && v.pePreviewOn === true,
        { layoutShown: shown(layoutGroup), dockW: Math.round(singleDock.width),
            previewShown: shown(v.peDom.preview), on: v.pePreviewOn });
    v.peSelection.cameras = ['front', 'back'];
    v.renderPhoneExportPanel();
    await sleep(400);
    check('两路时「摆放」卡回来，编辑器和预览各在其位',
        shown(layoutGroup) && shown(v.peDom.layout),
        { layoutShown: shown(layoutGroup), editorShown: shown(v.peDom.layout) });
    const wide = viewer.peComposeFrameWidth();
    check('合成预览按画布实际显示的像素取帧，不再 320 硬放大',
        wide > PHONE_EXPORT_FRAME_W,
        { fetchW: wide, previewCssW: v.peDom.preview?.clientWidth, dpr: devicePixelRatio });
    // The width is part of the fetcher's cache key, so if it moved when a layer opened or the preview
    // toggled, the same second got re-decoded under a new key and the caption the user was reading
    // went back to 正在取帧. It must not depend on what is currently visible.
    const widthOff = viewer.peComposeFrameWidth();
    v.peSelection.cameras = ['front'];
    await sleep(400);
    const widthSingle = viewer.peComposeFrameWidth();
    v.peSelection.cameras = ['front', 'back'];
    await sleep(400);
    check('取帧宽度不随预览开合/路数变化（不会反复重取同一秒）',
        widthOff === wide && widthSingle === wide, { widthOff, widthSingle, wide });

    // ---- 2. the segmented control: three tabs, one pane, thumb follows aria
    const tabs = [...modal.querySelectorAll('.pe-seg [data-pane]')];
    const panes = ['pePaneView', 'pePaneOver', 'pePaneRange'].map(dom);
    check('three tabs and three panes, tablist semantics',
        tabs.length === 3 && panes.every(Boolean)
        && tabs.every((t) => t.getAttribute('role') === 'tab' && t.getAttribute('aria-controls')),
        tabs.map((t) => ({ pane: t.dataset.pane, sel: t.getAttribute('aria-selected') })));

    const paneOf = (name) => ({
        view: panes[0], over: panes[1], range: panes[2],
    })[name];
    const settle = async (name) => {
        tabs.find((t) => t.dataset.pane === name).click();
        await sleep(60);
        return {
            selected: paneOf(name).hidden === false && shown(paneOf(name)),
            othersHidden: panes.filter((p) => p !== paneOf(name))
                .every((p) => p.hidden === true && !shown(p)),
            aria: tabs.map((t) => t.getAttribute('aria-selected')),
            scroll: v.peDom.body.scrollTop,
        };
    };
    const onOver = await settle('over');
    check('点叠加 shows only the 叠加 pane', onOver.selected && onOver.othersHidden, onOver);
    const onRange = await settle('range');
    check('点范围 shows only the 范围 pane and the scroll resets',
        onRange.selected && onRange.othersHidden && onRange.scroll === 0, onRange);
    const backToView = await settle('view');
    check('点画面 returns to the picture pane with one tab pressed',
        backToView.selected && backToView.othersHidden
        && backToView.aria.filter((a) => a === 'true').length === 1, backToView);

    // ---- 2b. every control must be under its own finger.
    // `element.click()` dispatches straight at the node and never hit-tests, so a page entirely
    // covered by one invisible overlay measures 100% interactive here and is 100% dead under a thumb
    // — which is exactly how 1.2.135 shipped.
    const covered = [];
    const folded = [];
    for (const name of ['view', 'over', 'range']) {
        await settle(name);
        for (const el of modal.querySelectorAll('button, input, [role="tab"]')) {
            if (!shown(el) || el.disabled) continue;
            const b = el.getBoundingClientRect();
            if (b.width < 20 || b.height < 20) continue;
            if (b.top < 0 || b.bottom > innerHeight) continue;
            // R90: a control scrolled past the scroller's lower edge is clipped *by its own scroller*,
            // and the point where it would have been belongs to the pinned dock. That is a fold, not an
            // overlay. Counted separately so a dock that ate half the page still shows up as a number.
            if (el.closest('.pe-body') && (b.bottom > bodyBox.bottom + 1 || b.top < bodyBox.top - 1)) {
                folded.push({ pane: name,
                    want: (el.dataset.overlay || el.dataset.camera || el.id || el.className)
                        .toString().slice(0, 22), y: Math.round(b.top) });
                continue;
            }
            const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            if (!(hit && (hit === el || el.contains(hit) || hit.contains(el)))) {
                covered.push({ pane: name,
                    want: (el.dataset.camera || el.dataset.size || el.dataset.overlay
                        || el.dataset.pane || el.id || el.className).toString().slice(0, 26),
                    got: hit ? hit.tagName + '.' + String(hit.className).slice(0, 26) : 'null' });
            }
        }
    }
    check('每个控件的中心点上就是它自己（没有隐形层盖住整页）',
        covered.length === 0, { covered: covered.slice(0, 8), count: covered.length,
            foldedBelow: folded.length, folded: folded.slice(0, 4) });

    // The general form of the trap: an absolutely positioned `::after` used to widen a touch target
    // anchors to the nearest POSITIONED ancestor. Make that host `static` and the expander silently
    // grows to cover the whole panel instead — invisible, and it swallows every tap.
    const unanchored = [];
    for (const el of document.querySelectorAll('#phoneExportModal *, #peZoomModal *')) {
        for (const side of ['::before', '::after']) {
            const ps = getComputedStyle(el, side);
            if (ps.content === 'none' || ps.content === '""' && ps.position !== 'absolute') continue;
            if (ps.position === 'absolute' && getComputedStyle(el).position === 'static') {
                unanchored.push((el.id || el.className || el.tagName) + side);
            }
        }
    }
    check('页内没有挂在祖先上的隐形绝对定位伪元素', unanchored.length === 0, { unanchored });

    // ---- 2c. R90: the dock is page furniture, so it survives every pane switch and never scrolls
    // away with the content above it.
    const dockPanes = [];
    for (const name of ['view', 'over', 'range']) {
        await settle(name);
        const b = dock.getBoundingClientRect();
        dockPanes.push({ pane: name,
            on: shown(dock) && b.width > 40 && b.bottom <= innerHeight + 1
                && b.top >= bodyBox.bottom - 2 });
    }
    check('三个段里预览带都钉在屏下（不随段落滚走）', dockPanes.every((p) => p.on), dockPanes);
    // A bottom-pinned bar whose content vanishes takes the switch with it: measured 190 px of travel
    // while the head was the dock's first row, so the second press — the one that turns the frame
    // back on — lands on whatever moved into the switch's old place.
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    await sleep(500);
    const yOn = dom('pePreviewBtn').getBoundingClientRect().top;
    v.togglePhoneExportPreview();
    await sleep(400);
    const yOff = dom('pePreviewBtn').getBoundingClientRect().top;
    const offDockH = Math.round(dock.getBoundingClientRect().height);
    check('预览帧开关在开/关两态下同一位置（第二下点得到）',
        Math.abs(yOn - yOff) <= 2 && v.pePreviewOn === false && offDockH < 90,
        { yOn: Math.round(yOn), yOff: Math.round(yOff), offDockH });
    v.togglePhoneExportPreview();
    await sleep(500);
    await settle('view');

    // The editor must keep the file's shape — that is the one thing it exists to be honest about.
    // Measured with two views, because a single view deliberately hides the drag editor (R87), so a
    // zero box there is correct, not a regression. Filling the page's leftover height with picture
    // is not available: a two-view composite is a 3.08:1 strip, so the editor is width-bound, and
    // the leftover goes to the card instead.
    //
    // Placed here rather than with the card checks above because it needs two things the page does
    // not hold by default: the 画面 pane settled (a measurement taken while its pane is hidden reads
    // `display: none` and a zero box, which is the app being correct, not failing), and a render,
    // because assigning the selection does not re-lay-out the canvas box by itself.
    const twoViews = v.peSelection.cameras.length > 1 ? v.peSelection.cameras.slice() : ['front', 'back'];
    v.peSelection.cameras = twoViews;
    v.renderPhoneExportPanel();
    await settle('view');
    await sleep(600);
    const canvasEl = modal.querySelector('.pe-canvas');
    const cbox = canvasEl.getBoundingClientRect();
    const plan2 = v.phoneExportPlan();
    const fileAspect = plan2.width / plan2.height;
    const rectAspect = cbox.width / cbox.height;
    check('摆放编辑器保持文件自身的形状（没有为了填高度被拉扁）',
        cbox.height > 40 && Math.abs(rectAspect - fileAspect) / fileAspect < 0.03,
        { fileAspect: +fileAspect.toFixed(3), rectAspect: +rectAspect.toFixed(3),
            box: [Math.round(cbox.width), Math.round(cbox.height)],
            paneHidden: !!panes[0].hidden, tiles: plan2.cameras.length });

    // ---- 3. what lives where
    const inPane = (pane, sel) => !!pane.querySelector(sel);
    check('画面 pane holds views, size and the layout editor',
        inPane(panes[0], '#peCameraChips') && inPane(panes[0], '#peSizeChips')
        && inPane(panes[0], '#peCanvas'),
        undefined);
    // R90: the preview is a sibling of the scroller, not a row inside a pane. Asserting it is absent
    // from all three is what makes the next check (it stays on screen while you switch panes) mean
    // something — a preview still living at the bottom of 画面 would pass that one by luck.
    check('预览带不在任何段里（它是页面级的一钉）',
        panes.every((pane) => !pane.querySelector('#pePreviewDock'))
        && !!dom('pePreviewDock').parentElement.classList.contains('phone-export-panel'),
        { parent: dom('pePreviewDock').parentElement.className });
    check('叠加 pane holds mosaic, watermark and the two chrome switches',
        inPane(panes[1], '#peOverlayChips') && inPane(panes[1], '#peWmContentChips')
        && inPane(panes[1], '#peChromeChips'), undefined);
    check('范围 pane holds the range and the marks',
        inPane(panes[2], '.pe-range-times') && inPane(panes[2], '#peMarkList')
        && inPane(panes[2], '#peFromNowBtn'), undefined);

    // 范围 two rows: the pair of times and the row of action buttons do not share a line box.
    await settle('range');
    const times = panes[2].querySelector('.pe-range-times').getBoundingClientRect();
    const actions = panes[2].querySelector('.pe-range-actions').getBoundingClientRect();
    check('范围 两行：时间一行、从当前进度/入点/出点一行',
        actions.top >= times.bottom - 1,
        { timesBottom: Math.round(times.bottom), actionsTop: Math.round(actions.top) });
    const sideBoxes = [...panes[2].querySelectorAll('.pe-side')].map((side) => {
        const box = side.getBoundingClientRect();
        return { top: Math.round(box.top), h: Math.round(box.height) };
    });
    check('起始 ± 与 结束 ± 各占一格，两格同高同行',
        sideBoxes.length === 2 && Math.abs(sideBoxes[0].top - sideBoxes[1].top) < 2
        && sideBoxes.every((s) => s.h >= 32 && s.h <= 64), sideBoxes);

    // ---- 4. the two switches really flip the request, and persist
    await settle('over');
    const labelChip = dom('peChromeChips').querySelector('[data-overlay="label"]');
    const badgeChip = dom('peChromeChips').querySelector('[data-overlay="badge"]');
    check('chips stamped from the selection',
        labelChip.getAttribute('aria-pressed') === String(v.peSelection.overlay.label)
        && badgeChip.getAttribute('aria-pressed') === String(v.peSelection.overlay.badge)
        && labelChip.classList.contains('on') === !!v.peSelection.overlay.label,
        { label: labelChip.getAttribute('aria-pressed'), badge: badgeChip.getAttribute('aria-pressed') });
    // Direction-agnostic: what matters is that one tap flips the key, re-stamps the chip and writes
    // the store — not which way the default happens to point.
    const flip = async (chip, key) => {
        const before = v.peSelection.overlay[key];
        chip.click();
        await sleep(50);
        const stored = JSON.parse(localStorage.getItem('tdashcam.exportOverlay') || '{}');
        return { key, before, after: v.peSelection.overlay[key],
            pressed: chip.getAttribute('aria-pressed'), on: chip.classList.contains('on'),
            stored: stored[key] };
    };
    const offBadge = await flip(badgeChip, 'badge');
    check('触发角标 one tap flips the key, the chip and the store',
        offBadge.after === !offBadge.before && offBadge.pressed === String(offBadge.after)
        && offBadge.on === offBadge.after && offBadge.stored === offBadge.after, offBadge);
    const backBadge = await flip(badgeChip, 'badge');
    check('再点一次 restores it', backBadge.after === offBadge.before, backBadge);
    const offLabel = await flip(labelChip, 'label');
    check('相机标签 is its own switch, single-view exports included',
        offLabel.after === !offLabel.before && offLabel.stored === offLabel.after
        && backBadge.after === true, offLabel);
    await flip(labelChip, 'label');
    check('chromeOptions matches the switches',
        JSON.stringify(v.chromeOptions()) === JSON.stringify({ label: true, badge: true }),
        v.chromeOptions());
    // A one-view export must still be able to ask for its own name: the complaint was that 单路 had
    // no mark and no way to want one.
    v.peSelection.cameras = ['front'];
    v.peCaptionKey = null;
    const single = v.phoneExportPlan();
    const singleChrome = (() => {
        const canvas = document.createElement('canvas');
        canvas.width = single.width; canvas.height = single.height;
        const rects = v.peRects();
        return v.pePaintPreviewChrome(canvas.getContext('2d'), canvas, single,
            [{ camera: 'front', paint: { x: 0, y: 0, w: rects[0].w * single.width,
                h: rects[0].h * single.height } }]);
    })();
    check('单路导出也有相机标签与触发角标（开关对一路同样有效）',
        singleChrome.filter((r) => !r.ring).length === 1,
        singleChrome.map((r) => ({ w: Math.round(r.w), h: Math.round(r.h), ring: !!r.ring })));
    v.peSelection.cameras = ['front', 'back'];

    // ---- 5. the plan carries the words and the trigger answer per view
    v.peSelection.cameras = ['front', 'back'];
    v.peCaptionKey = null;
    const plan = v.phoneExportPlan();
    check('plan sends a name and a fired answer per view',
        plan.cameras.length === 2 && plan.cameras.every((c) => typeof c.label === 'string'
            && c.label.length > 0 && typeof c.triggered === 'boolean'
            && typeof c.trigger === 'string'),
        plan.cameras.map((c) => ({ label: c.label, triggered: c.triggered, trigger: c.trigger })));
    check('trigger words are only carried by a view that fired',
        plan.cameras.every((c) => c.triggered || c.trigger === ''),
        plan.cameras.map((c) => [c.camera, c.triggered, c.trigger]));
    const hit = v.triggerViewsFor(ev);
    check('the fixture has a trigger answer at all', hit === null || (hit.views || []).length > 0,
        hit ? { views: hit.views, label: hit.label && hit.label.zh } : 'no reason on this event');

    // ---- 6. the preview paints the marks where the file will, and charges them
    v.peSelection.cameras = ['front', 'back'];
    if (!v.pePreviewOn) v.togglePhoneExportPreview();
    // A cold two-view fetch on the emulator runs into the tens of seconds while the player is still
    // holding decoder slots, so the wait is measured rather than assumed away: 「正在取帧」 is the
    // app being honest, and the check is that it stops being honest when the frames arrive.
    let frameWait = 0;
    for (let i = 0; i < 80 && /正在取帧|Fetching/.test(v.peDom.previewCap.textContent || ''); i += 1) {
        await sleep(500);
        frameWait += 500;
    }
    out.frameWaitMs = frameWait;
    // If it is still honest about waiting, say *why* in the same terms the fetcher uses: a stuck
    // caption and a slow caption are different defects and only the numbers tell them apart.
    out.frameState = (v.peDom.previewCap.textContent || '').includes('取帧')
        ? (() => {
            const plan = v.phoneExportPlan();
            return {
                planError: plan.error || null,
                live: FrameFetcher.live, queued: FrameFetcher.waiting.length,
                cache: FrameFetcher.cache.size,
                rows: v.peSelection.cameras.map((camera) => {
                    const target = v.peFrameTarget(camera, 0.25);
                    const url = target && FrameFetcher.peek(target.path, target.seconds, PHONE_EXPORT_FRAME_W);
                    const img = v.peFrameIsImage(url) ? v.peFrameImage(url) : null;
                    return { camera, hasTarget: !!target, hasUrl: !!url,
                        complete: img ? img.complete : null, nw: img ? img.naturalWidth : null };
                }),
            };
        })()
        : 'painted';
    const preview = v.peDom.preview;
    // The other half of 「画面放大不清晰」: the sheet's own preview box is 351 CSS px wide on a 2.625×
    // screen, i.e. 921 device px, and the canvas was being composed at a fixed 720 — a 1.28× upscale
    // that no amount of source resolution can undo. The backing store has to cover the box.
    // Settled first: measured from a hidden pane the box is 0 wide and the criterion passes on air.
    await settle('view');
    const pBox = preview.getBoundingClientRect();
    const needSheet = Math.floor(pBox.width * (window.devicePixelRatio || 1));
    check('页面里的预览帧画布也铺满自己的像素（不再固定 720）',
        preview.width >= needSheet - 1,
        { backing: preview.width, needWide: needSheet, cssWide: Math.round(pBox.width) });
    // Pinning the frame to the bottom puts it in a band with a height limit, and a limit applied to
    // the box alone stretches the bitmap: measured 380x240 for a 3.08:1 two-view plan, a 0.514
    // vertical squeeze — the same family of defect R21-2 fixed in the encoded file. Either the box
    // matches the picture, or `object-fit: contain` letterboxes it.
    const fits = [];
    for (const cams of [['front'], ['front', 'back']]) {
        v.peSelection.cameras = cams.slice();
        v.renderPhoneExportPanel();
        await sleep(1300);
        const b = preview.getBoundingClientRect();
        const pic = preview.width / preview.height;
        fits.push({ n: cams.length, box: [Math.round(b.width), Math.round(b.height)],
            picAspect: +pic.toFixed(3), stretch: +((b.width / b.height) / pic).toFixed(3),
            fit: style(preview).objectFit });
    }
    check('钉底预览不把画面拉进盒子里（宽条仍是宽条）',
        fits.every((f) => Math.abs(f.stretch - 1) < 0.02 || f.fit === 'contain'), fits);
    v.peSelection.cameras = ['front', 'back'];
    v.renderPhoneExportPanel();
    await sleep(600);
    const rects = v.peRects();
    const tiles = v.peSelection.cameras.map((camera, index) => {
        const box = rects[index];
        return { camera, x: box.x * preview.width, y: box.y * preview.height,
            w: box.w * preview.width, h: box.h * preview.height };
    });
    // The same shape the sheet's own pass builds, so a pass here is a pass there.
    const pictures = tiles.map((tile) => ({ camera: tile.camera,
        paint: { x: tile.x, y: tile.y, w: tile.w, h: tile.h } }));
    const scratch = document.createElement('canvas');
    scratch.width = preview.width;
    scratch.height = preview.height;
    const sctx = scratch.getContext('2d');
    const chromeRects = v.pePaintPreviewChrome(sctx, scratch, plan, pictures);
    const firedTiles = tiles.filter((t, index) => plan.cameras[index].triggered);
    const chips = chromeRects.filter((r) => !r.ring);
    const rings = chromeRects.filter((r) => r.ring);
    check('chrome preview draws one name per view and one outline per fired view',
        chips.length === tiles.length && rings.length === firedTiles.length,
        { chips: chips.length, rings: rings.length, tiles: tiles.length,
            fired: firedTiles.length });
    check('each name chip sits inside its own tile, near its top-left',
        chips.length === 2 && chips.every((chip, index) => {
            const tile = tiles[index];
            return chip.x >= tile.x && chip.y >= tile.y
                && chip.x + chip.w <= tile.x + tile.w + 1
                && chip.y + chip.h <= tile.y + tile.h + 1
                && chip.x - tile.x < tile.w * 0.25;
        }),
        chips.map((c, index) => ({ chip: Math.round(c.x), tile: Math.round(tiles[index].x),
            w: Math.round(c.w) })));
    check('each trigger outline is exactly its tile picture, inset by the line',
        rings.every((ring, index) => {
            const tile = firedTiles[index];
            return tile && Math.abs(ring.x - tile.x) < 1 && Math.abs(ring.w - tile.w) < 1
                && Math.abs(ring.y - tile.y) < 1 && Math.abs(ring.h - tile.h) < 1;
        }), rings.map((r) => ({ x: Math.round(r.x), w: Math.round(r.w),
            stroke: +r.ring.toFixed(2) })));
    check('描边宽度不细于 2px、也不粗过一路画面的 6%',
        rings.every((r) => r.ring >= 2 && r.ring < r.h * 0.06),
        rings.map((r) => +r.ring.toFixed(2)));

    const one = v.peOcclusionPercent(scratch, [chips[0]]);
    const twice = v.peOcclusionPercent(scratch, [chips[0], chips[0]]);
    const both = v.peOcclusionPercent(scratch, chips);
    check('遮挡读数 counts area, not a stack of identical rects',
        one > 0 && Math.abs(one - twice) < 0.001 && both > one,
        { one: +one.toFixed(3), twice: +twice.toFixed(3), both: +both.toFixed(3) });
    check('preview caption carries the 遮挡 reading',
        /%/.test(v.peDom.previewCap.textContent || '') && /\d/.test(v.peDom.previewCap.textContent || ''),
        { cap: v.peDom.previewCap.textContent });

    // The reason B won over A: the watermark, the mosaic and the two 画面标注 switches live on 叠加,
    // and the picture they change used to be painted at the bottom of a different pane. Counting the
    // lit pixels of the dock's own canvas before and after one tap is the claim made of pixels — a
    // caption that updates while the frame sits still would be the same defect in a new costume.
    await settle('over');
    const lit = () => {
        const c = v.peDom.preview;
        try {
            const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i] + d[i + 1] + d[i + 2] > 300) n += 1;
            }
            return n;
        } catch (e) { return `unreadable:${e.name}`; }
    };
    const stampChip = dom('peWmContentChips').querySelector('[data-overlay="stamp"]');
    const litOn = lit();
    stampChip.click();
    await sleep(400);
    const litOff = lit();
    check('在叠加段关「时间戳」，钉底预览当场少掉那一片亮字',
        typeof litOn === 'number' && typeof litOff === 'number' && litOn > litOff
        && litOn - litOff > 40,
        { litOn, litOff, dropped: (typeof litOn === 'number' && typeof litOff === 'number')
            ? litOn - litOff : null, pressed: stampChip.getAttribute('aria-pressed') });
    stampChip.click();
    await sleep(400);

    // ---- 7. the zoom layer
    v.peSelection.cameras = ['front'];
    v.peCaptionKey = null;
    const plan1 = v.phoneExportPlan();
    const layersBefore = v.phoneLayerCount();
    v.openPhoneExportZoom();
    const zoom = dom('peZoomModal');
    const zcanvas = dom('peZoomCanvas');
    await painted(() => zoom.classList.contains('show'));
    check('点预览帧 opens a full-screen layer of its own',
        zoom.classList.contains('show') && shown(zoom)
        && zcanvas.getBoundingClientRect().width > 0
        && v.phoneLayerCount() === layersBefore + 1,
        { layers: v.phoneLayerCount(), before: layersBefore,
            w: Math.round(zcanvas.getBoundingClientRect().width),
            pageShown: modal.classList.contains('show'), zoomCls: zoom.className,
            zoomDisp: zoom.style.display, pane: v.pePane });
    // R90 rewrote this criterion. It used to read 「drawn bigger」 as `zcanvas.width > preview.width`,
    // which the sharpness fix made meaningless: both canvases are now sized by the same derived number
    // (the pixels the screen can show), so widths tie. What actually decides whether the zoom looks
    // crisp is whether the bitmap covers the box it is displayed in, measured against that box.
    const zBox = zcanvas.getBoundingClientRect();
    const need = Math.floor(zBox.width * (window.devicePixelRatio || 1));
    check('放大层的画布铺满屏幕自己的像素（1× 下不再被放大）',
        Math.abs((zcanvas.width / zcanvas.height) - (plan1.width / plan1.height)) < 0.02
        && zcanvas.width >= need - 1
        && zcanvas.width * zcanvas.height > preview.width * preview.height,
        { zoom: [zcanvas.width, zcanvas.height], needWide: need, cssWide: Math.round(zBox.width),
            dpr: window.devicePixelRatio, sheet: [preview.width, preview.height],
            file: [plan1.width, plan1.height] });
    const at0 = v.peZoomAt;
    const timeText = dom('peZoomTime').textContent;
    check('zoom shows the second it is painting, and the caption',
        timeText.length > 0 && (dom('peZoomCap').textContent || '').length > 0
        && /\d/.test(dom('peZoomCap').textContent),
        { time: timeText, at: at0, cap: dom('peZoomCap').textContent });

    v.setPeZoomSecond(at0 + 3);
    await sleep(500);
    const moved = v.peZoomAt;
    check('左右滑换秒 moves the previewed second and its clock',
        Math.abs(moved - (at0 + 3)) < 0.01
        && dom('peZoomTime').textContent !== timeText,
        { at0: +at0.toFixed(2), moved: +moved.toFixed(2), time: dom('peZoomTime').textContent });
    v.setPeZoomSecond(9999);
    check('swipe past the end clamps to the range',
        v.peZoomAt <= v.pePreviewSpan() && v.peZoomAt > 0.2,
        { at: +v.peZoomAt.toFixed(2), span: +v.pePreviewSpan().toFixed(2) });
    v.setPeZoomSecond(-50);
    check('swipe before the start clamps to the first second',
        v.peZoomAt >= 0.05 && v.peZoomAt < 0.3, { at: +v.peZoomAt.toFixed(2) });

    v.setPeZoomScale(2);
    const transform = zcanvas.style.transform;
    check('双指缩放 scales the canvas by transform', /scale\(2\)/.test(transform), { transform });
    v.peZoomView.x = 9999;
    v.clampPeZoomPan();
    const limit = zcanvas.clientWidth * (v.peZoomView.scale - 1) / 2;
    check('放大后平移 not pannable past the picture',
        Math.abs(v.peZoomView.x - limit) < 1, { x: Math.round(v.peZoomView.x), limit: Math.round(limit) });
    v.setPeZoomScale(9);
    check('scale capped at 4', v.peZoomView.scale === 4, { scale: v.peZoomView.scale });
    v.setPeZoomScale(1);
    check('回到 1× clears the pan', v.peZoomView.x === 0 && v.peZoomView.y === 0, undefined);

    // The back gesture has to peel the zoom first, then the page, then nothing.
    const closed = v.closeTopLayer();
    await painted(() => !zoom.classList.contains('show') && v.phoneLayerCount() === layersBefore);
    check('返回 closes the zoom and leaves the page',
        closed === true && !zoom.classList.contains('show') && modal.classList.contains('show')
        && v.phoneLayerCount() === layersBefore,
        { layers: v.phoneLayerCount(), before: layersBefore });
    v.closeTopLayer();
    await painted(() => !modal.classList.contains('show'));
    check('再返回 closes the export page itself',
        !modal.classList.contains('show') && v.phoneLayerCount() < layersBefore,
        { layers: v.phoneLayerCount(), before: layersBefore });

    // The zoom layer is a sibling of the page, so closing the page any other way than 返回 must not
    // leave it covering a page that is gone. The two 返回 checks above already closed the page, so
    // re-open it — otherwise this measures "zoom opened over nothing", not the orphan case.
    await v.showPhoneExportModal();
    await sleep(300);
    v.openPhoneExportZoom();
    // `.show` lands in a requestAnimationFrame, and under load that frame can be later than a fixed
    // sleep; poll for the state instead of guessing its timing.
    for (let i = 0; i < 30 && !zoom.classList.contains('show'); i += 1) await sleep(100);
    check('放大层开着时关页面，放大层跟着关',
        zoom.classList.contains('show') && modal.classList.contains('show')
        && dom('peZoomModal').style.display !== 'none',
        { shown: zoom.classList.contains('show'), page: modal.classList.contains('show') });
    // Same corner-escape as the page nav: the zoom bar's 关闭 carries close-modal-btn too.
    const zbar = zoom.querySelector('.pe-zoom-bar').getBoundingClientRect();
    const zclose = dom('peZoomClose').getBoundingClientRect();
    check('放大层的关闭也在条内的左槽',
        zclose.top >= zbar.top - 1 && zclose.bottom <= zbar.bottom + 1
        && zclose.left >= zbar.left - 1 && zclose.left <= zbar.left + 12,
        { close: [Math.round(zclose.left), Math.round(zclose.top)],
            bar: [Math.round(zbar.left), Math.round(zbar.top)] });
    v.hidePhoneExportModal();
    await sleep(440);
    check('关页面后放大层也不再挂着',
        !modal.classList.contains('show') && !zoom.classList.contains('show')
        && zoom.style.display === 'none',
        { page: modal.classList.contains('show'), zoom: zoom.classList.contains('show'),
            display: zoom.style.display });

    // ---- 8. one action in the nav's right slot at a time
    await v.showPhoneExportModal();
    await sleep(140);
    await sleep(80);
    v.peJob = { id: 1, outPath: 'x' };
    v.renderPhoneExportPanel();
    await sleep(60);
    const exporting = panel.classList.contains('exporting');
    check('导出中 the nav swaps 开始导出 for 取消',
        exporting && !shown(dom('peStartBtn')) && shown(dom('peCancelBtn'))
        && dom('peStartBtn').disabled,
        { cls: exporting, start: shown(dom('peStartBtn')), cancel: shown(dom('peCancelBtn')) });
    v.peJob = null;
    v.renderPhoneExportPanel();
    await sleep(60);
    check('a finished job gives 开始导出 back',
        !panel.classList.contains('exporting') && shown(dom('peStartBtn'))
        && !shown(dom('peCancelBtn')), undefined);
    v.hidePhoneExportModal();
    await sleep(420);

    // ---- 9. the new wording follows the language, both directions
    const langBefore = v.currentLanguage;
    if (langBefore !== 'en') v.toggleLanguage();
    await sleep(80);
    const enTexts = {
        back: dom('peCloseBtn').textContent.trim(),
        view: tabs[0].textContent.trim(),
        over: tabs[1].textContent.trim(),
        label: labelChip.textContent.trim(),
        badge: badgeChip.textContent.trim(),
        hint: document.querySelector('.pe-zoom-hint').textContent.trim(),
    };
    check('英文重贴：nav / tabs / chrome / zoom hint',
        enTexts.view === 'Picture' && enTexts.over === 'Burn-in'
        && enTexts.label === 'View names' && enTexts.badge === 'Trigger outline'
        && /pinch/.test(enTexts.hint) && /Back/.test(enTexts.back), enTexts);
    if (v.currentLanguage !== langBefore) v.toggleLanguage();
    await sleep(80);
    const zhTexts = {
        view: tabs[0].textContent.trim(),
        label: labelChip.textContent.trim(),
        badge: badgeChip.textContent.trim(),
        group: document.querySelector('#pePaneOver .pe-label').textContent.trim(),
        chromeLabel: [...document.querySelectorAll('#pePaneOver .pe-label')]
            .map((el) => el.textContent.trim()),
    };
    check('中文回到原样，且画面标注是「画面标注」',
        zhTexts.view === '画面' && zhTexts.label === '相机标签'
        && zhTexts.badge === '触发角标' && zhTexts.chromeLabel.includes('画面标注'), zhTexts);

    // ---- 10. the sheet is still the sheet: no orphan, no dead id, no leftover card furniture
    check('no dead .modal-buttons left in the page',
        !panel.querySelector('.modal-buttons'), undefined);
    check('panes are inside a scrolling body, the body inside the panel',
        !!panel.querySelector('.pe-body') && style(panel.querySelector('.pe-body')).overflowY === 'auto',
        { overflow: style(panel.querySelector('.pe-body')).overflowY });

    if (KEPT === null) localStorage.removeItem('tdashcam.exportOverlay');
    else localStorage.setItem('tdashcam.exportOverlay', KEPT);
    return JSON.stringify(out);
})();

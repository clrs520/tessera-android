// R183 · 静态扫出来的手机档「档位外」font-size，逐条问运行时：这条声明到底赢没赢层叠、
// 节点在不在 DOM、有没有字、画没画。静态值只能证明「写了」，不能证明「用户看得见」。
// 档位：11 / 12 / 14.08 / 16（数据卡片与压在画面上的注记另有豁免，见 r102-verify.js 的 fontSkip）。
(async () => {
    const TIERS = [11, 12, 14.08, 16];
    const LIST = [
    {
        "sel": ".sidebar-header .header-title",
        "css": "16.80",
        "line": 4379
    },
    {
        "sel": ".help-text",
        "css": "14.40",
        "line": 4391
    },
    {
        "sel": "#selectFolderBtn",
        "css": "15.20",
        "line": 4463
    },
    {
        "sel": ".video-card .video-time",
        "css": "11.84",
        "line": 4621
    },
    {
        "sel": ".video-card .video-type",
        "css": "10.56",
        "line": 4629
    },
    {
        "sel": ".sidebar-header .header-title",
        "css": "14.72",
        "line": 4665
    },
    {
        "sel": ".perm-banner",
        "css": "11.52",
        "line": 4699
    },
    {
        "sel": "#selectFolderBtn",
        "css": "13.60",
        "line": 4736
    },
    {
        "sel": ".real-time-clock",
        "css": "12.80",
        "line": 4883
    },
    {
        "sel": ".camera-label",
        "css": "11.20",
        "line": 4999
    },
    {
        "sel": ".tab-icon",
        "css": "17.60",
        "line": 5109
    },
    {
        "sel": ".tab-label",
        "css": "10.56",
        "line": 5115
    },
    {
        "sel": "html.touch-ui .sidebar-header .search-cancel-btn",
        "css": "14.40",
        "line": 5774
    },
    {
        "sel": ".video-card .thumb-emoji",
        "css": "23.20",
        "line": 5916
    },
    {
        "sel": ".video-card .video-sub",
        "css": "11.20",
        "line": 5922
    },
    {
        "sel": ".row-swipe-delete",
        "css": "13.76",
        "line": 5973
    },
    {
        "sel": ".empty-hero-title",
        "css": "15.68",
        "line": 6838
    },
    {
        "sel": ".header-collapsed .header-actions-group .btn-icon",
        "css": "15.68",
        "line": 7077
    },
    {
        "sel": ".header-collapsed .header-actions-group .lang-toggle-btn .btn-icon",
        "css": "10.88",
        "line": 7093
    },
    {
        "sel": "html.touch-ui .metadata-fold",
        "css": "10.00",
        "line": 7248
    },
    {
        "sel": "html.touch-ui .metadata-panel.hud-folded .meta-speed-value",
        "css": "21.60",
        "line": 7302
    },
    {
        "sel": "html.touch-ui .metadata-panel.hud-folded .meta-speed-unit",
        "css": "9.28",
        "line": 7306
    },
    {
        "sel": ".speed-options div",
        "css": "15.00",
        "line": 7348
    },
    {
        "sel": ".stats-overlay",
        "css": "10.00",
        "line": 7414
    },
    {
        "sel": ".phone-export-panel h4",
        "css": "15.68",
        "line": 7642
    },
    {
        "sel": ".pe-nav .pe-nav-title, .phone-export-page h4.pe-nav-title",
        "css": "15.68",
        "line": 7692
    },
    {
        "sel": ".pe-nav-back",
        "css": "14.72",
        "line": 7723
    },
    {
        "sel": ".pe-nav-go, .pe-nav-cancel",
        "css": "14.72",
        "line": 7741
    },
    {
        "sel": ".pe-zoom-hint",
        "css": "11.20",
        "line": 7854
    },
    {
        "sel": ".pe-nudge",
        "css": "16.80",
        "line": 8040
    },
    {
        "sel": ".pe-to",
        "css": "12.80",
        "line": 8061
    },
    {
        "sel": ".pe-mini",
        "css": "12.80",
        "line": 8073
    },
    {
        "sel": ".pe-summary",
        "css": "11.84",
        "line": 8095
    },
    {
        "sel": ".pe-mark-name-input",
        "css": "13.44",
        "line": 8119
    },
    {
        "sel": ".pe-mark-del",
        "css": "18.40",
        "line": 8215
    },
    {
        "sel": ".route-map-title",
        "css": "11.52",
        "line": 8234
    },
    {
        "sel": ".route-note",
        "css": "11.84",
        "line": 8250
    },
    {
        "sel": ".route-legend",
        "css": "11.52",
        "line": 8258
    },
    {
        "sel": ".pe-tile",
        "css": "9.60",
        "line": 8304
    },
    {
        "sel": ".pe-progress .progress-text",
        "css": "11.84",
        "line": 8578
    },
    {
        "sel": ".pe-chips .recent-chip",
        "css": "12.80",
        "line": 8595
    },
    {
        "sel": ".phone-brightness-hud .pb-value",
        "css": "10.56",
        "line": 8909
    },
    {
        "sel": ".phone-boost-hud",
        "css": "11.84",
        "line": 8928
    },
    {
        "sel": ".phone-feed-hud",
        "css": "13.12",
        "line": 8951
    },
    {
        "sel": ".phone-gesture-hint",
        "css": "11.84",
        "line": 8996
    },
    {
        "sel": ".phone-gesture-hint button",
        "css": "18.40",
        "line": 9023
    },
    {
        "sel": ".about-version",
        "css": "12.80",
        "line": 9875
    },
    {
        "sel": "#aboutGithubBtn .about-row-value",
        "css": "11.52",
        "line": 9917
    },
    {
        "sel": ".about-donate-title",
        "css": "10.88",
        "line": 9936
    },
    {
        "sel": ".about-note",
        "css": "9.92",
        "line": 9941
    }
];
    const own = (n) => [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('').trim();
    const textOf = (n) => (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SELECT')
        ? (n.value || n.placeholder || '') : (own(n) || (!n.children.length ? (n.textContent || '').trim() : ''));
    // v2：`rect>0` 会把「在隐藏容器里但仍有盒子」的节点算成画出来了（`.header-collapsed`
    //      那个 15.68 就是这么冒出来的）。改问 checkVisibility，含 visibility/opacity 两Property。
    const shown = (n) => n.checkVisibility
        ? n.checkVisibility({ visibilityProperty: true, opacityProperty: true, contentVisibilityAuto: true })
        : n.offsetParent !== null;
    const rows = [];
    for (const item of LIST) {
        let nodes = [];
        try { nodes = [...document.querySelectorAll(item.sel)]; } catch (e) { rows.push({ sel: item.sel, err: 'bad selector' }); continue; }
        if (!nodes.length) { rows.push({ sel: item.sel, css: item.css, dom: 0 }); continue; }
        const sizes = [...new Set(nodes.map((n) => Math.round(parseFloat(getComputedStyle(n).fontSize) * 100) / 100))];
        const withText = nodes.filter((n) => (textOf(n) || '').trim());
        const painted = withText.filter((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && shown(n); });
        const off = sizes.filter((s) => !TIERS.some((t) => Math.abs(s - t) < 0.05));
        rows.push({ sel: item.sel, css: item.css, dom: nodes.length, sizes,
            text: withText.length, painted: painted.length, offTier: off,
            sample: painted[0] && (textOf(painted[0]) || '').slice(0, 18) });
    }
    const live = rows.filter((r) => r.offTier && r.offTier.length && r.painted > 0);
    const domOnly = rows.filter((r) => r.offTier && r.offTier.length && r.painted === 0);
    const dead = rows.filter((r) => !r.dom || (r.offTier || []).length === 0);
    return { total: rows.length, livePainted: live, notPainted: domOnly,
        tierCleanOrAbsent: dead.map((r) => r.sel + (r.dom ? ' sizes=' + r.sizes : ' absent')) };
})();

// Round-32 state probe: what is loaded, which layout/theme, and the new switches' current values.
(function () {
    var v = window.viewer;
    var out = {
        vp: innerWidth + 'x' + innerHeight,
        dark: document.body.classList.contains('dark-theme'),
        events: v.eventGroups ? v.eventGroups.length : -1,
        cards: document.querySelectorAll('.video-card').length,
        current: v.currentEvent ? v.currentEvent.eventId : null,
        highlightPref: localStorage.getItem('tdashcam.triggerHighlight'),
        tapPref: localStorage.getItem('tdashcam.tapBehavior'),
        platePref: localStorage.getItem('tdashcam.statsPlate'),
        heroShown: getComputedStyle(document.getElementById('emptyHero')).display,
        routeGroupCss: getComputedStyle(document.querySelector('.route-map-group')).display,
        sizeChips: null,
        fnTypes: ['applyTapEntryPoint', 'setStatsPlateFold', 'toggleStatsPlateFold', 'updateStatsFoldLabel',
            'triggerHighlightEnabled', 'tapBehavior', 'peSizeKey', 'eventOffsetSeconds']
            .map(function (m) { return m + '=' + typeof v[m]; }).join(','),
    };
    var panel = document.getElementById('phoneExportModal');
    if (panel) out.panelShown = getComputedStyle(panel).display;
    return JSON.stringify(out, null, 1);
})();

// Is the shipped stylesheet the one I edited? Grep the file the WebView actually loaded.
(async () => {
    const url = [...document.styleSheets].map(s => s.href).filter(Boolean);
    const txt = await (await fetch('styles.css')).text();
    const find = (needle) => {
        const i = txt.indexOf(needle);
        return i < 0 ? 'ABSENT' : txt.slice(Math.max(0, i - 90), i + 110).replace(/\s+/g, ' ');
    };
    const seg = txt.match(/\.choice-segment\s*\{[^}]*\}/);
    return JSON.stringify({
        sheets: url, bytes: txt.length,
        choiceSegment: seg ? seg[0].replace(/\s+/g, ' ').slice(0, 160) : 'ABSENT',
        funnel: find('flex: 0 0 40px'),
        pageName: find('header-page-name'),
        appName: find('header-app-name'),
        recentChip: find('.recent-dirs .recent-chip'),
    }, null, 1);
})();

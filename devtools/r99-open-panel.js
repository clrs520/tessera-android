// One call, one surface: leave the ⋮ panel open so `screencap` can catch what the user would see.
// Computed style said the headings were back long before a picture ever proved it (R42 lesson).
(async () => {
    const panel = document.getElementById('headerActionsGroup');
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const cs = (n, p) => getComputedStyle(n).getPropertyValue(p);
    for (let i = 0; i < 25 && +cs(panel, 'opacity') !== 1; i++) {
        if (i % 8 === 0) document.getElementById('tabMoreBtn').click();
        await sleep(250);
    }
    return JSON.stringify({ op: cs(panel, 'opacity'),
        // `getPropertyValue` wants the dashed name; a camelCase one silently returns "" and the count
        // comes out as 1 column no matter how the grid is really laid out.
        cols: getComputedStyle(panel).gridTemplateColumns.split(' ').filter(Boolean).length,
        over: panel.scrollHeight - panel.clientHeight });
})().catch(e => 'ERR ' + e.message)

// Does the bottom bar say which layer is up? Read the layers themselves next to the marks — the last
// version of this probe clicked `menuBtn` and then, because `?.click()` returns undefined, clicked
// the tab too, and reported the app as inverted when the probe was the thing double-toggling.
(async () => {
    const v = window.viewer;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const rows = [];
    const read = (tag) => {
        const drawer = !document.querySelector('.sidebar')?.classList.contains('collapsed');
        const panel = !!document.querySelector('.header-right')?.classList.contains('active');
        const mark = (id) => {
            const b = document.getElementById(id);
            if (!b) return 'absent';
            return `${b.classList.contains('on') ? 'ON' : '--'}${b.hasAttribute('aria-current') ? '*' : ''}`;
        };
        const bar = document.getElementById('phoneActionBar');
        const cs = getComputedStyle(bar);
        rows.push(`${tag.padEnd(22)} drawer=${drawer ? 'open ' : 'down '} panel=${panel ? 'open ' : 'down '}`
            + ` | 片段=${mark('tabListBtn')} 视图=${mark('tabLayoutBtn')} 设置=${mark('tabMoreBtn')}`
            + ` | bar op=${cs.opacity} vis=${cs.visibility}`);
    };
    const tap = async (id) => { document.getElementById(id).click(); await sleep(600); };
    read('start');
    await tap('tabListBtn'); read('tap 片段');
    await tap('tabMoreBtn'); read('tap 设置');
    await tap('tabMoreBtn'); read('tap 设置 again');
    await tap('tabListBtn'); read('tap 片段 again');
    await tap('tabListBtn'); read('back to start');
    return rows.join('\n');
})();

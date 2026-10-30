// The pill animates `bottom` over 300 ms, so reading it 120 ms after a class toggle measures the
// animation, not the layout. Settle between states and report both, plus the bar it has to clear.
(async () => {
    const v = window.viewer;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const before = document.querySelectorAll('.toast').length;
    v.showToast('已删除 9 个文件', 'success', 20000, { label: '撤销', onClick: () => {} });
    const pill = [...document.querySelectorAll('.toast')].slice(before)[0];
    const shot = async () => {
        await sleep(500);                       // the 300 ms transition, plus slack
        const r = pill.getBoundingClientRect();
        const bar = document.querySelector('.phone-action-bar');
        const visible = getComputedStyle(bar).visibility === 'visible'
            && getComputedStyle(bar).opacity !== '0';
        return { pillBottom: +r.bottom.toFixed(1), gap: +(innerHeight - r.bottom).toFixed(1),
            barVisible: visible, barTop: visible ? +bar.getBoundingClientRect().top.toFixed(1) : null,
            safeBottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') };
    };
    const out = {};
    document.body.classList.remove('sidebar-collapsed');
    out.drawerOpen = await shot();
    document.body.classList.add('sidebar-collapsed');
    out.drawerClosed = await shot();
    pill.remove();
    return JSON.stringify(out, null, 1);
})()

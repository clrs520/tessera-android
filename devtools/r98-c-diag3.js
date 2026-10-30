// The container's `transform` makes it the containing block for any `position: fixed` descendant, so
// a bottom-anchored pill measures against the column's own zero-height box. This simulates the fix
// without a rebuild: same classes, same shipped CSS, but parented to <body>. If the geometry lands,
// the only change needed is where showToast appends the node.
(() => {
    const v = window.viewer;
    const before = document.querySelectorAll('.toast').length;
    v.showToast('已删除 9 个文件', 'success', 9000, { label: '撤销', onClick: () => {} });
    const inColumn = [...document.querySelectorAll('.toast')].slice(before)[0];
    const measure = (node) => {
        const r = node.getBoundingClientRect();
        const a = node.querySelector('.toast-action').getBoundingClientRect();
        return { pill: [r.top, r.bottom, r.left, r.width].map(n => +n.toFixed(1)),
            action: [a.top, a.height, a.width].map(n => +n.toFixed(1)) };
    };
    const wrong = measure(inColumn);
    inColumn.remove();
    const before2 = document.querySelectorAll('.toast').length;
    v.showToast('已删除 9 个文件', 'success', 9000, { label: '撤销', onClick: () => {} });
    const pill = [...document.querySelectorAll('.toast')].slice(before2)[0];
    document.body.appendChild(pill);
    const out = { wrongParent: wrong };
    return new Promise((res) => setTimeout(() => {
        out.fixedParent = measure(pill);
        document.body.classList.add('sidebar-collapsed');
        setTimeout(() => {
            out.withTabBar = measure(pill);
            const bar = document.querySelector('.phone-action-bar').getBoundingClientRect();
            out.barTop = +bar.top.toFixed(1);
            out.innerHeight = innerHeight;
            pill.remove();
            res(JSON.stringify(out, null, 1));
        }, 400);
    }, 400));
})()

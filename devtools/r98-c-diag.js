// R98-C diagnosis: `position: fixed` with `top: auto` + `bottom: <len>` and `height: auto` resolves
// the used `top` from the static position, so the pill stayed at the top of the screen. Test the
// smallest change that makes `bottom` own the placement, and measure the rendered box.
(() => {
    const v = window.viewer;
    const s = document.createElement('style');
    s.id = 'r98-fix-test';
    s.textContent = '.toast.has-action { height: max-content; }';
    document.head.appendChild(s);
    const before = document.querySelectorAll('.toast').length;
    v.showToast('已删除 9 个文件', 'success', 8000, { label: '撤销', onClick: () => {} });
    const pill = [...document.querySelectorAll('.toast')].slice(before)[0];
    const read = () => {
        const r = pill.getBoundingClientRect();
        return { top: +r.top.toFixed(0), bottom: +r.bottom.toFixed(0), h: +r.height.toFixed(0),
            left: +r.left.toFixed(0), right: +r.right.toFixed(0) };
    };
    const shown = new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(read()))));
    return shown.then((first) => {
        document.body.classList.add('sidebar-collapsed');
        return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(read()))))
            .then((lifted) => {
                const bar = document.querySelector('.phone-action-bar').getBoundingClientRect();
                pill.remove();
                s.remove();
                return JSON.stringify({ innerHeight, first, lifted, barTop: +bar.top.toFixed(0) });
            });
    });
})()

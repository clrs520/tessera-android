// R182 · 把「长按菜单标题」的残留状态清干净，再跑套件 —— 否则字号普查那一格的红
// 可能是上一支判据留下的字（套件必须自己把前置造出来，不能靠上一次跑的余温）。
(async () => {
    const v = window.viewer;
    v?.hideCardContextMenu?.();
    if (v?.dom?.cardContextTitle) v.dom.cardContextTitle.textContent = '';
    document.body.classList.remove('context-open');
    document.querySelector('.card-context-menu')?.classList.remove('show');
    return {
        title: (document.getElementById('cardContextTitle')?.textContent || '').trim(),
        menuShow: document.querySelector('.card-context-menu')?.classList.contains('show'),
        events: (v?.eventGroups || []).length,
    };
})();

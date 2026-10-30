(() => {
    const v = window.viewer;
    v.refreshNavShift = function () {
        const sidebar = this.dom.sidebar;
        const row = this.dom.eventSearchRow;
        if (!sidebar || !sidebar.classList.contains('nav-search')) return;
        const measure = () => {
            if (row) row.style.transition = 'none';
            sidebar.classList.remove('nav-search');
            const dy = this.measureNavShift();
            sidebar.classList.add('nav-search');
            if (dy !== null) sidebar.style.setProperty('--nav-shift', dy.toFixed(1) + 'px');
            if (row) {
                void row.offsetHeight;
                row.style.transition = '';
            }
        };
        measure();
        clearTimeout(this._navShiftTimer);
        this._navShiftTimer = setTimeout(measure, 300);
    };
    const probe = () => {
        const sb = v.dom.sidebar;
        const t = sb.querySelector('.header-title').getBoundingClientRect();
        const r = document.querySelector('.event-search-row').getBoundingClientRect();
        return {
            off: Math.round((r.top + r.height / 2) - (t.top + t.height / 2)),
            rowTop: Math.round(r.top),
            shift: sb.style.getPropertyValue('--nav-shift'),
        };
    };
    v.refreshNavShift();
    const first = probe();
    return new Promise((res) => setTimeout(() => res(JSON.stringify({ first, settled: probe() })), 600));
})()

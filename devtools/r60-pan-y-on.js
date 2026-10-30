(() => {
    try {
        const sels = ['.sidebar-header', '.event-search-row', '.file-list', '.sidebar-footer'];
        for (const sel of sels) {
            const e = document.querySelector(sel);
            if (!e) return 'MISSING ' + sel;
            e.style.setProperty('touch-action', 'pan-y', 'important');
        }
        return JSON.stringify(sels.map(sel => sel + '=' + getComputedStyle(document.querySelector(sel)).touchAction));
    } catch (e) { return 'THREW ' + e.message; }
})()

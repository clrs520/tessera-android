// R183 · 改之前先在活包上试装这条规则：量三个输入框并档后会不会把行撑破。
// 这一步不写 CSS 到产品里，只注入一个 <style>，测完撤掉 —— 目的是让构建那一趟不白跑。
(async () => {
    const s = (ms) => new Promise((r) => setTimeout(r, ms));
    const v = window.viewer;
    const st = document.createElement('style');
    st.textContent = 'html.touch-ui .event-search,html.touch-ui .dir-path-input,html.touch-ui .pe-mark-name-input{font-size:var(--fs-body)}';
    document.head.appendChild(st);
    await s(250);
    const m = (sel) => {
        const n = document.querySelector(sel); if (!n) return { sel, absent: true };
        const r = n.getBoundingClientRect(); const cs = getComputedStyle(n);
        const row = n.closest('.event-search-row, .dir-path-row, .pe-mark-row, .pe-mark-item') || n.parentElement;
        const rr = row && row.getBoundingClientRect();
        return { sel, fs: cs.fontSize, h: Math.round(r.height), w: Math.round(r.width),
            rowOverflow: rr ? Math.round(rr.scrollWidth - rr.clientWidth) : null,
            visible: r.width > 0 && r.height > 0 };
    };
    v.toggleSidebar(true); await s(500);
    const search = m('#eventSearch');
    v.toggleSidebar(false); await s(400);
    v.openAndroidFolderBrowser && v.openAndroidFolderBrowser(); await s(1200);
    const dir = m('#androidDirPathInput');
    const dirShot = { open: !!document.querySelector('.dir-modal-content') };
    v.closeAndroidFolderBrowser && v.closeAndroidFolderBrowser(); await s(600);
    // 页面级横向溢出：任何一行被撑破都会在这里露出来
    const overflow = { docScroll: document.documentElement.scrollWidth, docClient: document.documentElement.clientWidth };
    st.remove();
    await s(200);
    const base = m('#eventSearch');
    return JSON.stringify({ withRule: { search, dir }, overflow, withoutRuleFs: base.fs });
})()

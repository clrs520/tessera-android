(() => {
    const keys = Object.keys(localStorage).filter(k => /lang|theme|tap|media|dir/i.test(k));
    const o = {};
    keys.forEach(k => o[k] = localStorage.getItem(k));
    o._uiLang = document.documentElement.lang || null;
    o._tapLabel = (document.querySelector('#tapChoiceLabel')||{}).textContent;
    return JSON.stringify(o);
})()

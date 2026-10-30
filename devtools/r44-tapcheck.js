(() => {
    const row = document.querySelector('#tapBehaviorChoice');
    const a = row.querySelector('[aria-checked="true"]');
    const toast = document.querySelector('.toast, #toast, .toast-msg');
    return JSON.stringify({
        stored: localStorage.getItem('tdashcam.tapBehavior'),
        active: a ? a.textContent.trim() : null,
        rowTitle: row.getAttribute('title'),
        ariaLabel: (document.querySelector('#tapChoiceLabel')||{}).textContent,
        toast: toast ? (toast.textContent || '').trim().slice(0, 40) : null,
        sheetOpen: !!document.querySelector('.header-collapsed .header-actions-group'),
        panelW: Math.round(document.querySelector('.header-collapsed .header-actions-group').getBoundingClientRect().width)
    });
})()

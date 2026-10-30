(() => {
    localStorage.setItem('tdashcam.tapBehavior', 'resume');
    const sheet = document.querySelector('.menu-sheet, #menuSheet, [id*=menu]');
    const closeBtn = document.querySelector('#menuCloseBtn, .menu-sheet-close, .sheet-close');
    if (closeBtn) closeBtn.click();
    if (sheet) sheet.classList.remove('open', 'visible', 'active');
    const back = document.querySelector('.menu-backdrop, .sheet-backdrop');
    if (back) back.click();
    return JSON.stringify({
        tap: localStorage.getItem('tdashcam.tapBehavior'),
        theme: localStorage.getItem('tdashcam.theme'),
        sheetClosed: !document.querySelector('.menu-sheet.open, #menuSheet.open'),
        orientation: window.orientation,
    });
})()

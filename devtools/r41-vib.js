(() => JSON.stringify({
    vib: window.__vib,
    menu: document.querySelector('.card-context-menu, .context-menu, .long-press-menu')?.className || null,
    bodyLast: [...document.querySelectorAll('.show, [class*=menu]')].slice(-4).map(e => e.className),
}, null, 1))()

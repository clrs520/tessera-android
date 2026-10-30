// R173 · bring the 来源 fold's toggle into the sheet's visible area. On a 412 px-tall landscape
// screen it sits below the fold of the scrollable panel, and `input tap` at a y outside the window
// simply goes nowhere — which reads as "the button does not work".
JSON.stringify((() => {
    const b = document.querySelector('.source-more-btn');
    if (!b) return { missing: true };
    b.scrollIntoView({ block: 'nearest' });
    const r = b.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight,
        // Sub-pixel: the row can settle at 412.4 in a 412 px window, which is on screen but fails a
        // bare `<=`.
        inView: r.top >= -0.5 && r.bottom <= innerHeight + 0.5 };
})());

(() => {
  const b = document.querySelector('.js-error-banner, #jsErrorBanner');
  return JSON.stringify({
    present: !!b,
    text: b ? b.textContent.trim().slice(0, 500) : null,
    visible: b ? getComputedStyle(b).display !== 'none' && b.offsetParent !== null : false,
    errs: (window.__jsErrors || []).slice(-5),
  });
})()

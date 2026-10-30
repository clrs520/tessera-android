// R162 — on a stock Android 10 WebView 74 the bundle cannot parse. The shell must say so instead
// of leaving an inert screen. ES5 only: this file itself is parsed by that old WebView.
(function () {
  var box = document.getElementById('unsupportedWebView');
  var out = {
    flag: window.__unsupportedWebView === true,
    box: !!box,
    text: box ? String(box.innerText || box.textContent || '') : null,
    viewer: typeof window.viewer,
    chrome: (String(navigator.userAgent).match(/Chrome\/[0-9.]+/) || [''])[0],
  };
  return JSON.stringify(out);
})()

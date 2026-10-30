(() => JSON.stringify({
  stored: localStorage.getItem('tdashcam.themeMode'),
  bodyDark: document.documentElement.className + ' | ' + document.body.className,
  bg: getComputedStyle(document.body).backgroundColor,
  checked: Array.from(document.querySelectorAll('#themeChoice .choice-segment')).map(s => s.dataset.mode + ':' + s.getAttribute('aria-checked')),
  toggleBtnDisplay: (() => { const b = document.getElementById('themeToggleBtn'); return b ? getComputedStyle(b).display : 'gone'; })(),
}))()

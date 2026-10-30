(() => {
  window.viewer.setThemeChoice('auto');
  window.viewer.toggleSidebar(false);
  document.activeElement && document.activeElement.blur();
  return JSON.stringify({ theme: localStorage.getItem('tdashcam.themeMode'), dark: document.body.classList.contains('dark-theme'), sb: document.querySelector('.sidebar').className });
})()

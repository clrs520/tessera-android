(() => {
  const out = {};
  return nativeInvoke('storage_status').then(s => {
    out.status = s;
    const btn = document.getElementById('selectFolderBtn');
    out.select_visible = btn ? getComputedStyle(btn).display : 'missing';
    if (btn) btn.click();
    return new Promise(r => setTimeout(r, 1200));
  }).then(() => {
    const modal = document.getElementById('androidDirModal');
    out.dialog = getComputedStyle(modal).display;
    out.where = document.getElementById('androidDirWhereName').textContent;
    out.compact = document.documentElement.className.includes('dir-compact') || !!document.querySelector('.dir-compact');
    const app = document.getElementById('androidDirAppBtn');
    const r = app.getBoundingClientRect();
    out.appBtn = {text: app.textContent, x: Math.round(r.left + r.width/2), y: Math.round(r.height ? r.top + r.height/2 : 0), w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(app).visibility};
    return JSON.stringify(out);
  });
})()

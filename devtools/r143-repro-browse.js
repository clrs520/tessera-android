(async () => {
  const v = window.viewer;
  if (!v) return 'no viewer';
  const snap = (tag) => ({
    tag,
    browsePath: v.androidBrowsePath,
    input: document.getElementById('androidDirPathInput').value,
    whereName: document.getElementById('androidDirWhereName').textContent,
    wherePath: document.getElementById('androidDirWherePath').textContent,
    rows: document.querySelectorAll('#androidDirList .dir-browser-item').length,
    firstRow: document.querySelector('#androidDirList .dir-browser-item')?.textContent || '',
    hintShown: getComputedStyle(document.getElementById('androidDirHint')).display !== 'none',
    hintTitle: document.getElementById('androidDirHintTitle').textContent,
    gone: !!v.dirBrowseGone,
  });
  const before = snap('before');
  // Two navigations in a row, no monkey-patching: the first path does not exist, so its error
  // branch awaits a gone-probe (+2s) before it writes browsePath/list.
  v.androidBrowseTo('/storage/emulated/0/QoderNope');
  v.androidBrowseTo('/storage/emulated/0/TeslaCam');
  const mid = snap('immediately-after-second-tap');
  await new Promise(r => setTimeout(r, 6000));
  const after = snap('after-6s');
  return JSON.stringify({ before, mid, after }, null, 1);
})()

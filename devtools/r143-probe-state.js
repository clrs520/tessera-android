(async () => {
  const v = window.viewer;
  const out = { hasViewer: !!v, ver: document.querySelector('#appVersion')?.textContent || '' };
  if (!v) return JSON.stringify(out);
  out.lastScannedPath = v.lastScannedPath;
  out.eventGroups = v.eventGroups.length;
  out.allFiles = v.allFiles.length;
  out.isScanning = !!v.isScanning;
  out.androidBrowsePath = v.androidBrowsePath || '';
  out.dirInput = document.getElementById('androidDirPathInput')?.value || '';
  out.wherePath = document.getElementById('androidDirWherePath')?.textContent || '';
  out.recent = [...document.querySelectorAll('#recentDirs .recent-chip')].map(c => c.dataset.path);
  out.scanToken = v.scanToken || 0;
  out.nativeSeq = v.constructor?.name || '';
  out.frameFetcherSeq = window.FrameFetcher ? 'window' : 'module';
  return JSON.stringify(out, null, 1);
})()

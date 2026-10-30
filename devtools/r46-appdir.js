(() => {
  const out = {};
  out.native_bridge = typeof window.TDashcamNative?.appFilesDir;
  out.raw_guess_exists = null;
  return nativeInvoke('storage_status').then(s => {
    out.storage_status = s;
    return nativeInvoke('list_subdirs', { path: s.app_files_dir }).then(
      r => { out.list_ok = true; out.entries = r.length; },
      e => { out.list_ok = false; out.error = String(e && e.message || e); }
    );
  }).then(() => JSON.stringify(out));
})()

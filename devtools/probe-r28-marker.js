(() => {
  const v = window.viewer;
  const out = {
    ver: (window.__tdashcamNativeState && window.__tdashcamNativeState.version) || null,
    drawerFooter: (() => { const f = document.querySelector('.sidebar-footer, .sidebar .app-version'); return f ? f.textContent.replace(/\s+/g, ' ').trim().slice(0, 40) : null; })(),
    hasEventPlace: typeof (v && v.metadataManager && v.metadataManager.eventPlace) === 'function',
    srcHasLabel: (() => { try { return v.eventMatchesSearch.toString().includes('getEventTypeLabel'); } catch (e) { return String(e); } })(),
    groups: v ? (v.eventGroups || []).length : null,
    errs: (window.__tdashcamErrors || []).slice(-3)
  };
  if (v && v.eventGroups && v.eventGroups.length) {
    const e0 = v.eventGroups[0];
    const probe = (q) => v.eventGroups.filter(e => v.eventMatchesSearch(e, q)).length;
    out.sampleType = e0.eventType;
    out.sampleLabel = v.videoListComponent.getEventTypeLabel(e0.eventType);
    out.countRaw = probe(String(e0.eventType).toLowerCase());
    out.countLabel = probe(String(out.sampleLabel).toLowerCase());
    out.countSentinelZh = probe('哨兵');
    out.countSentry = probe('sentry');
  }
  return JSON.stringify(out, null, 1);
})()

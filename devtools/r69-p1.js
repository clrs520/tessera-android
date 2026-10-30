// R69 patrol batch, part 1: the refresh toast and the event-card escaping.
// Both are read back from window.__v1 because a full rescan plus a toast can outrun the 10 s CDP
// answer window.
(async () => {
  const r = { steps: [], viewer: !!window.viewer };
  const toastText = () => (document.getElementById('toast') || {}).textContent || '';
  const settle = (ms) => new Promise(res => setTimeout(res, ms));

  // --- V1: a rescan of a folder that is no longer there must not claim to have found events.
  const goodPath = viewer.lastScannedPath;
  const nBefore = viewer.eventGroups.length;
  viewer.lastScannedPath = '/storage/emulated/0/TeslaCam/_definitely_not_here';
  r.steps.push('V1 rescan of a gone folder');
  await viewer.rescanCurrentFolder();
  await settle(300);
  r.v1Toast = toastText();
  r.v1SaidFound = /个事件|events/i.test(r.v1Toast);
  viewer.lastScannedPath = goodPath;
  await viewer.loadTauriDirectory(goodPath);
  r.v1Restored = viewer.eventGroups.length === nBefore;

  // --- V2: a place name from event.json must stay text, never markup.
  const hostile = Object.assign({}, viewer.eventGroups[0], {
    city: '<img id=r69inject src=x onerror="window.__r69pwned=1">',
    street: '"><b id=r69broke>oops</b>',
    lat: '"><i id=r69i>',
    lon: '1", onclick="window.__r69pwned=2'
  });
  window.__r69pwned = 0;
  const row = viewer.videoListComponent.createVideoCard(hostile);
  viewer.videoListComponent.container.appendChild(row);
  await settle(400);
  r.v2InjectedImg = !!document.getElementById('r69inject');
  r.v2InjectedB = !!document.getElementById('r69broke');
  r.v2Pwned = window.__r69pwned;
  const link = row.querySelector('.city-link');
  r.v2ShownAsText = link ? link.textContent.indexOf('<img') === 0 : null;
  r.v2LatAttr = link ? link.getAttribute('data-lat') : null;
  row.remove();

  return JSON.stringify(r, null, 1);
})()

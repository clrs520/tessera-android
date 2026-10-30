(async () => {
  const v = window.viewer;
  const BIG = '/storage/emulated/0/TeslaCam';
  const RACE = '/storage/emulated/0/TeslaCamRace';
  const log = [];
  const t0 = Date.now();
  const stamp = () => Date.now() - t0;
  const proto = Object.getPrototypeOf(v);
  const orig = proto.handleFolderSelection;
  const origProcess = proto.processFiles;

  v.handleFolderSelection = async function (files, token) {
    const root = (files[0] && String(files[0].path).split('/')[3]) || '?';
    log.push(`enter hFS ${root} n=${files.length} token=${token === undefined ? 'none' : token} scanToken=${this.scanToken} @${stamp()}`);
    if (log.filter(l => l.includes('enter')).length === 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
    const out = await orig.call(this, files, token);
    log.push(`left hFS ${root} groups=${this.eventGroups.length} @${stamp()}`);
    return out;
  };
  proto.processFiles = async function (files) {
    const root = (files[0] && String(files[0].path).split('/')[3]) || '?';
    const t = Date.now();
    const g = await origProcess.call(this, files);
    log.push(`processFiles ${root} -> ${g.length} in ${Date.now() - t}ms @${stamp()}`);
    return g;
  };

  v.lastScanSignature = null;
  const a = v.loadTauriDirectory(BIG);
  const t = Date.now();
  while (!log.some(l => l.includes('enter')) && Date.now() - t < 10000) await new Promise(r => setTimeout(r, 20));
  const enteredAt = stamp();
  const b = v.loadTauriDirectory(RACE);
  await b;
  log.push(`B settled groups=${v.eventGroups.length} path=${v.lastScannedPath} @${stamp()}`);
  await a;
  log.push(`A settled groups=${v.eventGroups.length} path=${v.lastScannedPath} @${stamp()}`);
  await new Promise(r => setTimeout(r, 600));
  delete v.handleFolderSelection;
  delete proto.processFiles;
  const roots = [...new Set(v.eventGroups.map(g => String(g.eventId).split('/')[0]))];
  return JSON.stringify({ enteredAt, finalRoots: roots, finalGroups: v.eventGroups.length,
    path: v.lastScannedPath, log }, null, 1);
})()

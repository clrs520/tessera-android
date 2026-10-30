(async () => {
  const playing = [...document.querySelectorAll('video')].map(v => v.src).find(s => /\/media\//.test(s));
  if (!playing) return JSON.stringify({ err: 'no playing video for token' });
  const token = playing.match(/\/media\/([^/]+)\//)[1];
  const base = playing.replace(/\/media\/[^/]+\/.*$/, '/media/' + token + '/');
  const b64 = (p) => btoa(unescape(encodeURIComponent(p))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const paths = [
    '/storage/emulated/0/TeslaCam/SavedClips/2026-10-08_07-41-59/event.json',
    '/storage/emulated/0/TeslaCam/SavedClips/2026-10-08_07-41-59/2026-10-08_07-30-59-front.mp4',
  ];
  const out = [];
  for (const p of paths) {
    try {
      const r = await fetch(base + b64(p));
      const head = (await r.text()).slice(0, 260);
      out.push({ p: p.split('/').slice(-2).join('/'), status: r.status, ct: r.headers.get('content-type'), len: head.length, head: head.slice(0, 200) });
    } catch (e) { out.push({ p, err: String(e).slice(0, 120) }); }
  }
  return JSON.stringify(out, null, 1);
})()

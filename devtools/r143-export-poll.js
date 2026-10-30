(async () => {
  const v = window.viewer;
  const t = Date.now();
  while (v.peJob && Date.now() - t < 420000) await new Promise(r => setTimeout(r, 3000));
  return JSON.stringify({ stillJob: !!v.peJob, percent: v.pePercent,
    text: (document.getElementById('peProgressText') || {}).textContent || '',
    waited: Math.round((Date.now() - t) / 1000) });
})()

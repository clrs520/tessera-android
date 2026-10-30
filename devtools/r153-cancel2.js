// R153 #11 补：零帧取消的文案（页面按 payload.code 选词）与「有帧取消」的真实入账。
// 零帧现场在 AVD 上无法用 JS 跑到：主线程被解码占住，取消定时器落地时已写 24 帧；
// 「空壳不保留」由引擎 keep = framesWritten > 0 && size > 0 代码可证（ExportEngine.kt）。
(async () => {
  const v = window.viewer;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const out = {};
  const seen = [];
  const toast = v.showToast.bind(v);
  v.showToast = (msg, ...rest) => { seen.push(String(msg)); return toast(msg, ...rest); };

  const feed = (code) => {
    v.peJob = { id: 7700 + Math.floor(Math.random() * 1000), outPath: '', at: Date.now() };
    v.peTerminalSeen = null;
    v.onPhoneExportProgress({
      id: v.peJob.id, phase: 'cancelled', code, percent: 0,
      frames: code === 'cancelledKept' ? 37 : 0,
      bytes: code === 'cancelledKept' ? 5930 : 0,
      path: code === 'cancelledKept' ? '/storage/emulated/0/Download/x.mp4' : '',
      message: code === 'cancelledKept' ? 'cancelled, the written part is kept' : 'cancelled',
    });
  };
  feed('cancelled');
  const zeroToast = seen.slice(-1)[0] || '';
  feed('cancelledKept');
  const keptToast = seen.slice(-1)[0] || '';
  v.showToast = toast;
  v.peTerminalSeen = null;
  v.peJob = null;

  out.zeroToast = zeroToast;
  out.keptToast = keptToast;
  out.verdict = {
    zeroSaysCancelled: /已取消/.test(zeroToast) && !/保存在文件里/.test(zeroToast),
    keptSaysKept: /已取消/.test(keptToast) && /保存在文件里/.test(keptToast),
  };
  out.pass = Object.values(out.verdict).every(Boolean);
  return JSON.stringify(out, null, 1);
})()

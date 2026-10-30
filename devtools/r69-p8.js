// 欠账 #2 的最后一块：p4 量的是 computed color vs 背景，**没有把按钮上的 opacity 折进字色**。
// opacity:0.4 会把整棵子树压向后方，所以「跟系统」那一行的真实对比度要按折叠后的字色算。
// 这条把 group opacity 沿链乘进去；两个主题各量一遍（切主题后等 600ms，防止量到过渡中途），
// 背景取两个极端：板后全黑 / 板后全白 —— 面板是半透明板，它下面是什么 CSS 说不了。
(() => {
  const out = window.__p8 = { runs: [] };
  const triple = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const alphaOf = s => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
  const lum = s => {
    const [r, g, b] = triple(s).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const blend = (fg, bg, a) => {
    const f = triple(fg), b = triple(bg);
    return `rgb(${f.map((v, i) => Math.round(v * a + b[i] * (1 - a))).join(',')})`;
  };
  const ratio = (a, b) => +((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2);
  const bgChain = (el, under) => {
    const stops = [];
    for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (/^rgb/.test(c) && alphaOf(c) > 0) stops.unshift(c);
    }
    let acc = under;
    for (const c of stops) acc = blend(c, acc, alphaOf(c));
    return acc;
  };
  const groupOpacity = el => {
    let o = 1;
    for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const read = id => {
    const btn = document.getElementById(id);
    if (!btn) return { id, missing: true };
    const lbl = btn.querySelector('.btn-text') || btn;
    const cs = getComputedStyle(lbl);
    const op = groupOpacity(lbl);
    const row = { id, label: lbl.textContent.trim(), disabled: btn.disabled, px: cs.fontSize, opa: +op.toFixed(2) };
    for (const [tag, under] of [['Blk', 'rgb(0,0,0)'], ['Wht', 'rgb(255,255,255)']]) {
      const bg = bgChain(lbl, under);
      row['bg' + tag] = bg;
      row['raw' + tag] = ratio(cs.color, bg);      // 只看 computed color（p4 的量法）
      row['eff' + tag] = ratio(blend(cs.color, bg, op), bg);  // 把组透明度折进字色
    }
    return row;
  };
  const IDS = ['brightnessRowBtn', 'exportMetadataBtn', 'metaDetailBtn', 'diagnosticsBtn'];
  const settle = ms => new Promise(r => setTimeout(r, ms));
  const restoreThemeDark = document.body.classList.contains('dark-theme') || /dark/.test(document.body.className);
  (async () => {
    for (const dark of [restoreThemeDark, !restoreThemeDark]) {
      viewer.applyTheme(dark);
      await settle(600);
      out.runs.push({ theme: document.body.className, level: viewer.brightnessLevel, rows: IDS.map(read) });
    }
    viewer.applyTheme(restoreThemeDark);
    out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300));
  return 'armed: read window.__p8';
})()

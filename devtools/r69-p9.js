// p8 的两处作废原因：⋮ 面板没开（整棵子树 opacity 0 → 对比度算成 1），切主题用错了入口
// （applyTheme 会被原生状态推送顶掉）。这条改成 setThemeChoice，并且只在面板**开着**时量。
// 组透明度沿链乘进字色：opacity:0.4 压的是整棵子树，等效字色 = blend(字色, 板底, 0.4)。
(() => {
  const out = window.__p9 = { runs: [], note: 'panel must be open' };
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
    const row = { id, label: lbl.textContent.trim(), dis: btn.disabled, px: cs.fontSize, opa: +op.toFixed(2) };
    for (const [tag, under] of [['Blk', 'rgb(0,0,0)'], ['Wht', 'rgb(255,255,255)']]) {
      const bg = bgChain(lbl, under);
      row['bg' + tag] = bg;
      row['raw' + tag] = ratio(cs.color, bg);
      row['eff' + tag] = ratio(blend(cs.color, bg, op), bg);
    }
    return row;
  };
  const IDS = ['brightnessRowBtn', 'exportMetadataBtn', 'metaDetailBtn', 'diagnosticsBtn'];
  const settle = ms => new Promise(r => setTimeout(r, ms));
  const prevMode = viewer.themeMode();
  const panelOpen = () => document.querySelector('.header-right').classList.contains('active');
  (async () => {
    out.panelOpen = panelOpen();
    if (!out.panelOpen) { out.abort = 'panel closed'; return; }
    for (const mode of ['light', 'dark']) {
      viewer.setThemeChoice(mode);
      await settle(700);
      out.runs.push({
        want: mode, theme: document.body.className,
        darkClass: document.body.classList.contains('dark-theme'),
        rows: IDS.map(read)
      });
    }
    viewer.setThemeChoice(prevMode);
    await settle(400);
    out.restored = viewer.themeMode();
    out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300));
  return 'armed: read window.__p9';
})()

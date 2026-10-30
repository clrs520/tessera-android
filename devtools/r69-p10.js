// 「亮度行禁用态」到底要多亮才过 AA：先拿到两个主题下 .btn-text 的 computed color 和板底链，
// 再沿 opacity 扫一遍，找**最小**能过 4.5:1 的那一档（板后取全黑/全白两个极端，谁差听谁的）。
// 只读，不改样式；结论用来决定 CSS 里那一档写多少。
(() => {
  const out = window.__p10 = { runs: [] };
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
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
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
  // 祖先链里除了本行了还有谁带 opacity（面板容器自己若有淡入，会把这一档再乘一遍）
  const chainOpaExceptSelf = el => {
    let o = 1;
    for (let n = el.parentElement; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const settle = ms => new Promise(r => setTimeout(r, ms));
  const prevMode = viewer.themeMode();
  (async () => {
    for (const mode of ['light', 'dark']) {
      viewer.setThemeChoice(mode);
      await settle(700);
      const btn = document.getElementById('brightnessRowBtn');
      const lbl = document.getElementById('brightnessRowLabel');
      const ena = btn.disabled;
      btn.disabled = false;                       // 只为取「未被 :disabled 影响」的字色
      const cs = getComputedStyle(lbl);
      const glyph = cs.color, size = cs.fontSize, weight = cs.fontWeight;
      btn.disabled = ena;
      const anc = chainOpaExceptSelf(btn);
      const row = { mode, glyph, size, weight, ancestorOpacity: +anc.toFixed(2), scan: [] };
      for (const under of ['rgb(0,0,0)', 'rgb(255,255,255)']) {
        const bg = bgChain(lbl, under);
        const worst = { under, bg, at: {} };
        for (const a of [0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 1]) {
          worst.at[a] = +ratio(blend(glyph, bg, a * anc), bg).toFixed(2);
        }
        row.scan.push(worst);
      }
      const minPass = under => {
        for (const a of [0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 1]) {
          const both = row.scan.every(s => s.at[a] >= 4.5);
          if (both) return a;
        }
        return null;
      };
      row.minOpacityPassingAA = minPass();
      out.runs.push(row);
    }
    viewer.setThemeChoice(prevMode);
    await settle(300);
    out.restored = viewer.themeMode();
    out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300));
  return 'armed: read window.__p10';
})()

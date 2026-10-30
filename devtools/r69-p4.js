// 「亮度：跟系统」为什么是灰的？先看代码，再看数：updateBrightnessRow() 里 `btn.disabled = neutral`
// —— 已经是跟系统时没有可交还的东西，禁用是设计。那么剩下的问题只有一个：
// 这一行同时是**读数的唯一出口**，禁用态的文字还读得清吗？
// 同一把尺子量三种状态：禁用（跟系统）/ 启用且提亮 / 启用且变暗，再和两条对照行比。
(() => {
  const lum = s => {
    const [r, g, b] = s.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // A translucent plate is not a contrast endpoint: blend it over what's behind, then measure the
  // opaque content pixel, never the plate centre (that's how R61 got fooled by the dim veil).
  const blend = (fg, bg) => {
    const f = fg.match(/[\d.]+/g).map(Number);
    const b = bg.match(/[\d.]+/g).map(Number);
    const a = f.length > 3 ? f[3] : 1;
    return `rgb(${f.slice(0, 3).map((v, i) => Math.round(v * a + b[i] * (1 - a))).join(',')})`;
  };
  // The panel is a translucent plate over video pixels, which CSS cannot describe: this is the
  // stack blended over black (i.e. the worst case for light text), not a promise about what is
  // actually behind the glyphs. Good enough to compare the disabled row against its neighbours,
  // not good enough to certify AA on its own.
  const bgChain = el => {
    const stops = [];
    for (let n = el; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor;
      if (/^rgb/.test(c) && !/, 0\)$/.test(c)) stops.unshift(c);
    }
    let acc = 'rgb(0,0,0)';
    for (const c of stops) acc = blend(c, acc);
    return acc;
  };
  const ratio = (a, b) => +((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2);
  const read = id => {
    const btn = document.getElementById(id);
    if (!btn) return { id, missing: true };
    const lbl = btn.querySelector('.btn-text') || btn;
    const cs = getComputedStyle(lbl);
    const eff = bgChain(lbl);
    return {
      id, label: lbl.textContent.trim(), disabled: btn.disabled,
      color: cs.color, size: cs.fontSize, weight: cs.fontWeight,
      behind: eff, contrast: ratio(cs.color, eff),
      opacity: getComputedStyle(btn).opacity, trunc: lbl.scrollWidth > lbl.clientWidth
    };
  };
  return JSON.stringify({
    theme: document.body.className, lang: viewer.currentLanguage,
    level: viewer.brightnessLevel,
    rows: ['brightnessRowBtn', 'exportMetadataBtn', 'metaDetailBtn', 'diagnosticsBtn'].map(read)
  }, null, 1);
})()

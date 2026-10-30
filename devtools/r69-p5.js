// 上一份量到「跟系统」是 disabled + opacity 0.4，那是设计（没有可交还的东西）。
// 这条补上另一半：提亮 / 变暗时这一行必须**变亮且带数字**，而且数字装得下。
// 三种状态在同一个页面实例里连着量，最后一律复位成跟系统 —— 屏幕会短暂变亮/变暗，这是有意的。
(() => {
  const btn = document.getElementById('brightnessRowBtn');
  const lbl = document.getElementById('brightnessRowLabel');
  const panelBg = (() => { let n = lbl; while (n) { const c = getComputedStyle(n).backgroundColor; if (/^rgb/.test(c) && !/, 0\)$/.test(c)) return c; n = n.parentElement; } return 'unknown'; })();
  const one = tag => ({
    tag, level: viewer.brightnessLevel, label: lbl.textContent,
    disabled: btn.disabled, opacity: getComputedStyle(btn).opacity,
    box: Math.round(lbl.clientWidth), need: Math.round(lbl.scrollWidth),
    fits: lbl.scrollWidth <= lbl.clientWidth, panelBg
  });
  const out = { before: one('as-found'), states: [] };
  const levels = [1.29, 1.6, 0.67];
  const restore = viewer.brightnessLevel;
  try {
    for (const lv of levels) { viewer.setBrightness(lv); out.states.push(one(`set ${lv}`)); }
    // 英文那一遍：文案框只有这么宽，中文过了不代表英文过
    viewer.setLanguage && viewer.setLanguage('en');
    for (const lv of [1.29, 1]) { viewer.setBrightness(lv); out.states.push(`en@${lv} ` + JSON.stringify(one('en').label) + ` fits=${one('en').fits} box=${one('en').box} need=${one('en').need}`); }
    viewer.setLanguage && viewer.setLanguage('zh');
  } catch (e) { out.err = String(e && e.message || e); }
  finally { viewer.setBrightness(restore); out.after = one('restored'); }
  return JSON.stringify(out, null, 1);
})()

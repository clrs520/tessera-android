// R154 · 三条常驻判据：
//  1) 触摸壳内每一个可达控件在键盘聚焦时都必须长出可见焦点环（R143 遗留 :focus-visible）。
//  2) 动态面字号：导出进度行在「有字」时也只能是四档之一（R134 普查扫不到它，R153 补）。
//  3) 服务级拒绝载荷必须带 code（busy / startFailed），页面才能按语言取词。
(async () => {
  for (let i = 0; i < 40 && !window.viewer; i++) await new Promise(r => setTimeout(r, 500));
  const v = window.viewer;
  if (!v) return JSON.stringify({ harness: 'no viewer' });
  const out = {};

  // 1) Focus ring coverage. `:focus-visible` cannot be forced from page script, so a scripted
  //    `focus()` would answer "no ring" even for a correct sheet — a false red. Read the shipped
  //    rule instead: the declaration has to be a real ring, and its selector has to reach each
  //    focusable control. Both halves are checked, so `outline: none` or a rule that only covers
  //    the bottom bar both fail.
  const rings = [];   // { selectors: string[], style: CSSStyleDeclaration }
  let mediaRules = 0;
  const walk = (list) => {
    for (const rule of list) {
      // Recursive by *type*, not by `cssRules` truthiness: a media/supports/layer block needs
      // its children walked, and every other rule's `style` is what we came for.
      if (rule.cssRules && rule.cssRules.length) {
        mediaRules += 1;
        walk(rule.cssRules);
        continue;
      }
      const sel = rule.selectorText || '';
      if (!sel.includes(':focus-visible')) continue;
      const style = rule.style || {};
      rings.push({ selectors: sel.split(',').map(s => s.trim()), style });
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules); } catch (e) { /* cross-origin sheet */ }
  }
  // A shorthand containing `var()` does not expand into its longhands in the CSSOM — `outline`
  // reads back, `outlineWidth`/`outlineStyle` are empty strings. Reading only the longhands
  // called the shipped rule unusable; both forms have to be understood.
  const ringOf = (style) => {
    const shorthand = style.getPropertyValue('outline') || '';
    const width = parseFloat(style.getPropertyValue('outline-width')) || 0;
    const outlineStyle = style.getPropertyValue('outline-style') || '';
    const offset = parseFloat(style.getPropertyValue('outline-offset')) || 0;
    if (shorthand) {
      const w = /(\d*\.?\d+)px/.exec(shorthand);
      const none = /\bnone\b/.test(shorthand) || /\b0px\b/.test(shorthand);
      return { ok: !none && !!w && parseFloat(w[1]) >= 1.5 && offset >= 1, shorthand };
    }
    return { ok: outlineStyle !== '' && outlineStyle !== 'none' && width >= 1.5 && offset >= 1, shorthand: '' };
  };
  const ringSels = rings.filter(r => ringOf(r.style).ok);
  const focusables = [...document.querySelectorAll(
    '.phone-action-bar button, .sidebar button, .header-actions-group button, .phone-export-panel button, ' +
    '.phone-export-panel input, .card-context-menu button, .dir-modal-content button, .about-panel button, ' +
    '.gesture-panel button, .toast-action')]
    .filter(el => el.offsetParent !== null && !el.disabled && el.getAttribute('tabindex') !== '-1');
  const matchesRing = (el) => ringSels.some(r => r.selectors.some(sel => {
    try { return el.matches(sel.replace(/:focus-visible/g, '')); } catch (e) { return false; }
  }));
  const missing = focusables.filter(el => !matchesRing(el))
    .slice(0, 10).map(el => el.className || el.id || el.tagName);
  out.focus = {
    ringRules: rings.length,
    usableRules: ringSels.length,
    checked: focusables.length,
    missing,
  };

  // 2) Dynamic-face font size: give the progress line text, then measure it.
  const text = document.querySelector('.pe-progress .progress-text');
  if (text) {
    const saved = text.textContent;
    text.textContent = '已写入 12/34 帧';
    const fs = parseFloat(getComputedStyle(text).fontSize);
    text.textContent = saved;
    out.progressFont = { px: fs, ok: [11, 12, 14.08, 16].some(t => Math.abs(t - fs) < 0.05) };
  } else {
    out.progressFont = { ok: false, why: 'no .pe-progress .progress-text' };
  }

  // 3) Refusal payloads carry a code: the page must be able to compose both languages.
  const was = v.currentLanguage;
  v.currentLanguage = 'zh';
  const busyZh = v.engineText({ code: 'busy', message: 'x' });
  const startFailedZh = v.engineText({ code: 'startFailed', message: 'x' });
  v.currentLanguage = 'en';
  const busyEn = v.engineText({ code: 'busy', message: 'x' });
  v.currentLanguage = was;
  out.refusals = { busyZh, busyEn, startFailedZh };

  out.verdict = {
    focusCovered: focusables.length > 0 && ringSels.length > 0 && missing.length === 0,
    progressFontToken: out.progressFont.ok === true,
    busyLocalized: /导出任务/.test(busyZh) && /already running/i.test(busyEn),
    startFailedLocalized: /起不来/.test(startFailedZh),
  };
  out.pass = Object.values(out.verdict).every(Boolean);
  return JSON.stringify(out, null, 1);
})()

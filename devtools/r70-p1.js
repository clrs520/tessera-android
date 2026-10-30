// R70 verification: the injected --row-disabled-opa rule, measured with the ⋮ sheet actually open.
// p13's contrast half was degenerate (opa 0) because a closed sheet has subtree opacity 0, so every
// ratio collapsed to 1 — a false pass. This probe aborts instead of measuring unless .header-right.active.
(() => {
  const out = window.__r70 = { steps: [] };
  const fail = m => { out.err = m; out.done = true; };
  const right = document.querySelector('.header-right');
  if (!right) return fail('no .header-right');
  if (!right.classList.contains('active')) return fail('sheet closed — open #tabMoreBtn first');
  const btn = document.getElementById('brightnessRowBtn');
  const lbl = document.getElementById('brightnessRowLabel');
  if (!btn || !lbl) return fail('no brightness row');

  const triple = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const alphaOf = s => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
  const lum = s => { const [r, g, b] = triple(s).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const blend = (fg, bg, a) => { const f = triple(fg), b = triple(bg); return `rgb(${f.map((v, i) => Math.round(v * a + b[i] * (1 - a))).join(',')})`; };
  const ratio = (a, b) => +((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2);
  const bgChain = (el, under) => { const stops = []; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (/^rgb/.test(c) && alphaOf(c) > 0) stops.unshift(c); } let acc = under; for (const c of stops) acc = blend(c, acc, alphaOf(c)); return acc; };
  const groupOpa = el => { let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const rect = el => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };

  const measure = () => {
    const opa = groupOpa(lbl);
    const bg = bgChain(lbl, 'rgb(0,0,0)');
    const glyph = getComputedStyle(lbl).color;
    // a neighbour row that is NOT disabled is the control: it says the sheet is really lit.
    const nbr = [...document.querySelectorAll('.header-right .control-btn:not(:disabled) .btn-text')][0];
    return {
      text: lbl.textContent,
      disabled: btn.disabled,
      btnRect: rect(btn),
      px: getComputedStyle(lbl).fontSize,
      opa: +opa.toFixed(3),
      glyph, bg,
      eff: ratio(blend(glyph, bg, opa), bg),
      neighbour: nbr ? { text: nbr.textContent.slice(0, 10), opa: +groupOpa(nbr).toFixed(3), eff: ratio(blend(getComputedStyle(nbr).color, bgChain(nbr, 'rgb(0,0,0)'), groupOpa(nbr)), bgChain(nbr, 'rgb(0,0,0)')) } : null,
    };
  };

  const restore = viewer.themeMode();
  const st = document.createElement('style');
  st.id = 'r70-preview';
  // The token definitions do not exist on the installed build yet, so a rule that only references
  // var(--row-disabled-opa) resolves to nothing and opacity falls back to 1 — which looks like a pass.
  st.textContent = `
:root{--row-disabled-opa:.65}
body.dark-theme{--row-disabled-opa:.55}
html.touch-ui .header-right .control-btn:disabled{ opacity: var(--row-disabled-opa) !important; }`;
  document.head.appendChild(st);

  (async () => {
    for (const phase of ['before', 'after']) {
      if (phase === 'before') st.remove(); else document.head.appendChild(st);
      for (const mode of ['light', 'dark']) {
        viewer.setThemeChoice(mode);
        await new Promise(r => setTimeout(r, 700));
        out.steps.push({ phase, mode, token: getComputedStyle(document.body).getPropertyValue('--row-disabled-opa').trim(), ...measure() });
      }
    }
    st.remove();
    viewer.setThemeChoice(restore);
    out.done = true;
  })().catch(e => fail(String(e && e.stack || e).slice(0, 300)));
  return 'armed: read window.__r70';
})()

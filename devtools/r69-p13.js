// 装机前先注入这两条新规则，量「改完是不是真的躲开了角标 / 真的过 AA」，再决定要不要花 6 分钟构建。
// 注入的是即将写进 styles.css 的同一段：默认角落 8→40，禁用行 opacity 走 --row-disabled-opa。
(() => {
  const out = window.__p13 = { };
  const st = document.createElement('style');
  st.id = 'r70-preview';
  st.textContent = `
:root{--row-disabled-opa:.65}
body.dark-theme{--row-disabled-opa:.55}
@media (orientation: landscape) and (max-height: 620px) and (max-width: 1200px){
  .metadata-panel{ top: var(--hud-top, 40px) !important; }
}
html.touch-ui .header-right .control-btn:disabled{ opacity: var(--row-disabled-opa) !important; }`;
  document.head.appendChild(st);
  const mm = viewer.metadataManager;
  const triple = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const alphaOf = s => { const m = s.match(/[\d.]+/g); return m && m.length > 3 ? Number(m[3]) : 1; };
  const lum = s => { const [r, g, b] = triple(s).map(v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const blend = (fg, bg, a) => { const f = triple(fg), b = triple(bg); return `rgb(${f.map((v, i) => Math.round(v * a + b[i] * (1 - a))).join(',')})`; };
  const ratio = (a, b) => +((Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)).toFixed(2);
  const bgChain = (el, under) => { const stops = []; for (let n = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (/^rgb/.test(c) && alphaOf(c) > 0) stops.unshift(c); } let acc = under; for (const c of stops) acc = blend(c, acc, alphaOf(c)); return acc; };
  const groupOpa = el => { let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return o; };
  const rect = el => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const ov = (a, b) => Math.round(Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])));
  const labelRow = () => {
    const labels = [...document.querySelectorAll('.camera-label')].map(l => rect(l)).filter(r => r[2] > 0);
    const p = rect(mm.dom.panel);
    const hits = labels.map(r => ov(p, r)).filter(v => v > 0);
    return { panel: p, labels: labels.length, coveredPctOfLabel: hits.length ? hits.map(v => +(v / 680 * 100).toFixed(0)) : [] };
  };
  const contrast = () => {
    const btn = document.getElementById('brightnessRowBtn');
    const lbl = document.getElementById('brightnessRowLabel');
    const op = groupOpa(lbl);
    const bg = bgChain(lbl, 'rgb(0,0,0)');
    return { disabled: btn.disabled, opa: +op.toFixed(2), bg, eff: ratio(blend(getComputedStyle(lbl).color, bg, op), bg) };
  };
  const restore = { meta: mm.currentMetadata, state: mm.hudState, stored: localStorage.getItem('tdashcam.metaHud') };
  (async () => {
    const s0 = await mm.readTelemetry({ path: '/storage/emulated/0/TeslaCam/_r69probe/seg0.mp4' });
    mm.currentMetadata = s0; mm.isLoading = false;
    mm.updateUIStatus(); mm.updateDisplay(5);
    localStorage.removeItem('tdashcam.metaHud'); mm.hudState = null;
    mm.releaseHudTouchGeom();
    mm.dom.panel.style.removeProperty('--hud-top');
    mm.dom.panel.style.removeProperty('--hud-left');
    mm.dom.panel.classList.remove('is-moved');
    out.geom = [];
    for (const lay of ['grid', 'grid4', 'single', 'picture-in-picture']) {
      viewer.multiCameraPlayer.setLayout(lay);
      await new Promise(r => setTimeout(r, 450));
      for (const fold of [true, false]) {
        mm.setHudFold(fold);
        await new Promise(r => setTimeout(r, 120));
        out.geom.push(Object.assign({ lay, fold }, labelRow()));
      }
    }
    out.contrast = [];
    for (const mode of ['light', 'dark']) {
      viewer.setThemeChoice(mode);
      await new Promise(r => setTimeout(r, 600));
      out.contrast.push({ mode, ...contrast() });
    }
    viewer.setThemeChoice('auto');
    out.vw = innerWidth; out.done = true;
  })().catch(e => out.err = String(e && e.stack || e).slice(0, 300))
    .finally(() => {
      document.getElementById('r70-preview').remove();
      mm.currentMetadata = restore.meta; mm.isLoading = false;
      mm.hudState = restore.state;
      if (restore.stored === null) localStorage.removeItem('tdashcam.metaHud'); else localStorage.setItem('tdashcam.metaHud', restore.stored);
      mm.dom.panel.style.removeProperty('--hud-top');
      mm.dom.panel.style.removeProperty('--hud-left');
      mm.dom.panel.classList.remove('is-moved');
      mm.updateUIStatus(); mm.syncHudFold();
      viewer.multiCameraPlayer.setLayout('grid4');
    });
  return 'armed: read window.__p13';
})()

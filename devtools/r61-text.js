(() => {
  try {
    const lum = (c) => {
      const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const parse = s => s.match(/\d+/g).slice(0, 3).map(Number);
    const over = (fg, bgA, bgB) => { // alpha-composite fg over bg
      const a = (fg[3] === undefined) ? 1 : fg[3];
      return [0,1,2].map(i => Math.round(a * fg[i] + (1 - a) * bgB[i]));
    };
    const plate = [65, 69, 73];
    const out = {};
    for (const sel of ['.empty-hero-title', '.empty-hero-hint', '.empty-hero-icon', '#emptyHeroBtn']) {
      const el = document.querySelector(sel);
      const cs = getComputedStyle(el);
      const c = parse(cs.color);
      const alpha = cs.color.startsWith('rgba') ? parseFloat(cs.color.split(',')[3]) : 1;
      const eff = over([c[0], c[1], c[2], alpha], null, plate);
      const l1 = lum(eff), l2 = lum(plate);
      out[sel] = { raw: cs.color, px: cs.fontSize + '/' + cs.fontWeight, onPlate: eff.join(','),
        ratio: +(((Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05)).toFixed(2)) };
    }
    return JSON.stringify(out, null, 1);
  } catch (e) { return 'THREW ' + e.message; }
})()

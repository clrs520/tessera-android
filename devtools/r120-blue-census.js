// R120 · 蓝色普查：手机上**真的画出来**的蓝紫，按实渲值聚类。
//
// 静态 grep 只能数源码里的字面量，数不出「同一屏上有几种深度」——那要看层叠之后的
// computed 值。这一份遍历所有有盒子的元素，把四类会着色的属性（字色 / 底色 / 描边 /
// SVG 填充）里落在蓝紫色相带、且饱和度够的一律收进来，按 rgb 值聚类，附上样例选择器
// 与它所在的那一面（最近的有 id/class 的祖先）。
//
// 两个主题各跑一遍：同一支 token 在深浅两头是不同的色值，「不统一」要分开算。
(() => {
    const HUE_MIN = 190, HUE_MAX = 300, SAT_MIN = 0.14;
    const toHsl = ([r, g, b]) => {
        r /= 255; g /= 255; b /= 255;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        if (!d) return [0, 0, mx];
        const h = 60 * ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) + 6) % 360;
        return [h, d / (1 - Math.abs(mx + mn - 1)), (mx + mn) / 2];
    };
    const path = (el) => {
        const bits = [];
        for (let n = el; n && n !== document.body && bits.length < 3; n = n.parentElement) {
            if (!n) break;
            bits.unshift(n.id ? '#' + n.id : (String(n.className || '').trim().split(/\s+/)[0] || n.tagName.toLowerCase()));
        }
        return bits.join(' ');
    };
    const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    const walk = () => {
    const buckets = new Map();
    const add = (kind, rgb, el, extra) => {
        const [h, s] = toHsl(rgb);
        if (h < HUE_MIN || h > HUE_MAX || s < SAT_MIN) return;
        const key = `${kind} ${rgb.join(',')}`;
        const a = (rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / 255;
        if (!buckets.has(key)) buckets.set(key, { kind, rgb: hex(rgb), hue: +h.toFixed(0), light: +a.toFixed(2), n: 0, samples: [] });
        const b = buckets.get(key);
        b.n += 1;
        if (b.samples.length < 3) b.samples.push(path(el) + (extra ? ' ' + extra : ''));
    };
    const all = [...document.querySelectorAll('body *')];
    for (const el of all) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (own) add('字色', parseInk(cs.color), el, '«' + el.textContent.trim().slice(0, 10) + '»');
        const bg = parseInk(cs.backgroundColor);
        if (bg.length === 3 && +cs.opacity > 0.05 && !/rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(cs.backgroundColor)) add('底色', bg, el);
        for (const side of ['Top', 'Left']) {
            if (parseFloat(cs['border' + side + 'Width']) > 0) add('描边', parseInk(cs['border' + side + 'Color']), el, side.toLowerCase());
        }
        if (el.tagName === 'svg' || el.tagName === 'SVG') {
            for (const n of el.querySelectorAll('path,circle,rect,line,polyline,polygon')) {
                const s = getComputedStyle(n);
                if (s.fill && s.fill !== 'none' && s.fill.startsWith('rgb')) add('图标填充', parseInk(s.fill), el.closest('[class]') || el);
                if (s.stroke && s.stroke !== 'none' && s.stroke.startsWith('rgb')) add('图标描边', parseInk(s.stroke), el.closest('[class]') || el);
            }
        }
    }
    const rows = [...buckets.values()].sort((x, y) => x.kind.localeCompare(y.kind) || x.hue - y.hue);
    return { theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light', scanned: all.length, rows };
    };
    const wasDark = document.body.classList.contains('dark-theme');
    const result = {};
    result[wasDark ? 'dark' : 'light'] = walk();
    document.body.classList.toggle('dark-theme');
    try { result[wasDark ? 'light' : 'dark'] = walk(); }
    finally { document.body.classList.toggle('dark-theme'); }
    return result;
})()

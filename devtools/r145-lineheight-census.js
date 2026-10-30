// R145 全站普查：还有没有「行盒装不下字身 + overflow 裁掉」的第二支 .tab-label。
// 判据形状与 R145 同构：单行、纵向 overflow 裁切、行盒 < 该元素自己那支字体的字身、且墨真的溢出。
// 只普查「看得见且有字」的叶子；动态面（抽屉/目录浏览器/导出页）要各自打开后再跑一遍。
(async () => {
  if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch (e) {} }
  const ctx = document.createElement('canvas').getContext('2d');
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (!/hidden|clip/.test(cs.overflowY)) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    if (el.children.length) continue;                       // 只看叶子，容器另算
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const lh = parseFloat(cs.lineHeight);
    if (Number.isNaN(lh)) continue;
    const fs = parseFloat(cs.fontSize);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const m = ctx.measureText(el.textContent.trim());
    const box = Math.ceil(m.fontBoundingBoxAscent + m.fontBoundingBoxDescent);
    if (lh >= box) continue;                                // 行盒够高，不是这一类
    const overflowInk = el.scrollHeight > el.clientHeight;  // 墨真的溢出
    const key = `${el.className}|${cs.fontSize}|${lh}|${box}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sel: (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ').join('.') : el.tagName),
               text: el.textContent.trim().slice(0, 22), fs, lh, box,
               scrollH: el.scrollHeight, clientH: el.clientHeight, inkClipped: overflowInk,
               nowrap: cs.whiteSpace === 'nowrap', ellipsis: cs.textOverflow });
  }
  out.sort((a, b) => (b.inkClipped - a.inkClipped) || (b.box - b.lh) - (a.box - a.lh));
  return JSON.stringify({ scanned: document.querySelectorAll('body *').length,
    suspects: out.length, inkClippedCount: out.filter(o => o.inkClipped).length, list: out.slice(0, 40) }, null, 1);
})()

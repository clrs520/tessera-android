// R151 #28 判据 · 验证（跑在「已点过最小框」之后）：
//   未选中的框不显示控件；选中后 40px 控件完全落在框外、互不重叠，× 仍可删。
(async () => {
  const v = window.viewer;
  const out = { checks: [], pass: 0, total: 0, harness: null };
  const ok = (n, p, d) => { out.total++; if (p) out.pass++; out.checks.push({ name: n, pass: !!p, detail: d }); };
  const r = e => { if (!e) return null; const b = e.getBoundingClientRect();
    return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1),
      r: +(b.right).toFixed(1), b: +(b.bottom).toFixed(1) }; };

  // 打码：点过最小框之后应当只有它被选中
  const canvas = v.peDom?.mosaicCanvas;
  if (!canvas) { out.harness = 'no mosaic canvas'; return JSON.stringify(out); }
  const boxes = [...canvas.querySelectorAll('.pe-mosaic-box')];
  const tiny = boxes.find(b => b.dataset.box === '1');
  const normal = boxes.find(b => b.dataset.box === '0');
  if (!tiny) {
    // On the old build the tap landed on the 26 px × that covered the 5×5 px box and deleted it.
    ok('tapping the smallest box selects it instead of hitting its ×', false,
      { boxesLeft: boxes.length, selected: v.peMosaicSelected || null });
    return JSON.stringify(out);
  }
  const sel = v.peMosaicSelected;
  const del = tiny && tiny.querySelector('.pe-mosaic-del');
  const grip = tiny && tiny.querySelector('.pe-mosaic-grip');
  const cs = el => el ? getComputedStyle(el) : {};
  const tinySel = !!tiny && tiny.classList.contains('selected');
  ok('tapping the smallest box selects it and only it',
    tinySel && !!normal && !normal.classList.contains('selected')
      && sel && sel.index === 1,
    { tinySel, normalSel: normal && normal.classList.contains('selected'), sel });

  const dr = r(del), gr = r(grip), tr = r(tiny);
  const noOverlap = dr && gr && (dr.b <= gr.y || gr.b <= dr.y || dr.r <= gr.x || gr.r <= dr.x);
  ok('selected box shows two 40px controls, fully outside its corners, not overlapping',
    cs(del).display !== 'none' && cs(grip).display !== 'none'
      && Math.round(dr.w) === 40 && Math.round(dr.h) === 40 && Math.round(gr.w) === 40 && Math.round(gr.h) === 40
      && dr.r <= tr.x + 0.5 && dr.b <= tr.y + 0.5 && gr.x >= tr.r - 0.5 && gr.y >= tr.b - 0.5
      && noOverlap,
    { del: dr, grip: gr, box: tr, noOverlap });
  ok('unselected box keeps its controls hidden',
    !!normal && cs(normal.querySelector('.pe-mosaic-del')).display === 'none'
      && cs(normal.querySelector('.pe-mosaic-grip')).display === 'none',
    { del: normal && cs(normal.querySelector('.pe-mosaic-del')).display,
      grip: normal && cs(normal.querySelector('.pe-mosaic-grip')).display });

  // ③ 画布四周留了外挂柄的余量
  const cw = r(canvas);
  const pane = canvas.parentElement.getBoundingClientRect();
  ok('canvas leaves ≥40px around itself for the outside controls',
    cw.x - pane.left >= 40 && pane.right - cw.r >= 40,
    { canvas: cw, paneLeft: +pane.left.toFixed(1), paneRight: +pane.right.toFixed(1) });

  return JSON.stringify(out);
})()

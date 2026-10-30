// R145：底部条的英文标签不许被纵向裁掉，也不许被横向省略。
// `.tab-label` 原本是 font-size 11 / line-height 11 / overflow hidden —— 盒子 11px，而这个字体的
// 字身是 16px（canvas fontBoundingBox 上 12 + 下 4），于是 p g y 的下伸部被削掉。
// 截图逐像素量过：掉的是**下缘**（"Settings" 墨底 2343→2347），大写顶没掉。
// 中文没有下伸部，所以这个洞只有英文看得见。
// 断言不用 scrollHeight 的 ±1 容差：那会让 1px 的真裁切假通过（1.2.228 就是这么漏的）。
(async () => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ fatal: 'no viewer' });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const checks = [];
  const add = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

  // 界面字体是 @font-face（Noto Sans SC）。没加载完时 canvas 量到的是回退字体的字身（13px），
  // 加载完才是真的 16px —— 判据②会在「还没加载」那一拍白捡一个通过。先等字体表落地。
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* 老 WebView 没有就不等，下面会自证 */ }
  }
  const bar = document.getElementById('phoneActionBar');
  if (!bar) return JSON.stringify({ fatal: 'no #phoneActionBar' });
  const labels = () => [...bar.querySelectorAll('.tab-label')];

  // —— 前置条件：条子真的可见、标签真的在排版（display:none 时空通过是本判据要防的第一件事）——
  const barStyle = getComputedStyle(bar);
  const barBox = bar.getBoundingClientRect();
  if (barStyle.display === 'none' || barBox.height < 10) {
    return JSON.stringify({ fatal: `bar not laid out: display=${barStyle.display} h=${barBox.height}` });
  }
  if (labels().length === 0 || labels().some(l => !l.textContent.trim())) {
    return JSON.stringify({ fatal: `labels missing: ${labels().length}` });
  }

  // 字体的真实字身：判据的比较对象，不是行高的推导来源。
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontBoxOf = (el) => {
    const s = getComputedStyle(el);
    ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    const m = ctx.measureText(el.textContent.trim());
    return { px: Math.ceil(m.fontBoundingBoxAscent + m.fontBoundingBoxDescent),
             raw: `${Math.round(m.fontBoundingBoxAscent)}+${Math.round(m.fontBoundingBoxDescent)}`,
             font: s.fontSize };
  };

  const read = () => labels().map(l => {
    const s = getComputedStyle(l);
    const box = fontBoxOf(l);
    return { text: l.textContent.trim(), scrollH: l.scrollHeight, clientH: l.clientHeight,
             scrollW: l.scrollWidth, clientW: l.clientWidth,
             lineHpx: parseFloat(s.lineHeight), fontH: parseFloat(s.fontSize),
             fontBox: box.px, fontBoxRaw: box.raw,
             overflow: s.overflow, ellipsis: s.textOverflow, display: s.display };
  });

  const prevLang = v.currentLanguage;
  v.setLanguage('en');
  await sleep(600);
  const barH = Math.round(bar.getBoundingClientRect().height);
  const rows = read();

  // ① 纵向不许裁：内容高必须装进盒子，0 容差。
  const clipped = rows.filter(r => r.scrollH > r.clientH);
  add('en-tab-label-not-clipped-vertically', clipped.length === 0,
    clipped.length ? clipped : rows.map(r => `${r.text} ${r.scrollH}<=${r.clientH}`));
  // ② 行高要盖住这个字体的字身（不是「≥1.15 倍字号」这种猜测阈值）。
  const tight = rows.filter(r => !(r.lineHpx >= r.fontBox));
  add('en-tab-label-line-box-covers-font-box', tight.length === 0,
    tight.length ? tight : rows.map(r => `${r.text} lh=${r.lineHpx} box=${r.fontBox}(${r.fontBoxRaw}) font=${r.fontH}`));
  // ③ 横向也不许被省略号吃掉：英文单词必须完整读出来。
  const cut = rows.filter(r => r.scrollW > r.clientW);
  add('en-tab-label-not-ellipsis-cut', cut.length === 0,
    cut.length ? cut : rows.map(r => `${r.text} ${r.scrollW}<=${r.clientW}`));
  // ④ 长词保险不许被顺手拆掉（overflow hidden + ellipsis 仍要在，防未来更长的译文）。
  add('en-tab-label-keeps-ellipsis-guard',
    rows.every(r => r.overflow === 'hidden' && r.ellipsis === 'ellipsis'),
    rows.map(r => `${r.text} ${r.overflow}/${r.ellipsis}`));
  // ⑤ 反例守卫：加行高不许把底部条撑高（R145 之前实测 57px）。
  add('bar-height-unchanged', Math.abs(barH - 57) <= 1, { barH, rows: rows.map(r => r.lineHpx) });

  v.setLanguage('zh');
  await sleep(400);
  const zhRows = read();
  add('zh-tab-labels-still-fit', zhRows.every(r => r.scrollH <= r.clientH), zhRows);
  v.setLanguage(prevLang);
  await sleep(200);

  const failed = checks.filter(c => !c.pass);
  return JSON.stringify({ total: checks.length, pass: checks.length - failed.length,
    failed: failed.map(c => c.name), checks }, null, 1);
})()

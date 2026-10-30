// R67-C: which candidate label fits the ⋮ grid cell without ellipsis, in both languages?
(() => {
  const btn = document.getElementById('brightnessRowBtn');
  const text = document.getElementById('brightnessRowLabel');
  const cell = btn.getBoundingClientRect().width;
  const cands = [
    '亮度：跟系统', '亮度：提亮 130%', '亮度：调暗 67%',
    'Brightness: system', 'Brightness: +130%', 'Brightness: dim 67%', 'Brightness: 67%',
    'Trigger border: off', 'Starred only: off'
  ];
  const keep = text.textContent;
  const out = cands.map(s => {
    text.textContent = s;
    return { s, w: Math.round(text.scrollWidth), fits: text.scrollWidth <= Math.ceil(text.clientWidth) };
  });
  text.textContent = keep;
  return { cell: Math.round(cell), client: text.clientWidth, out };
})();

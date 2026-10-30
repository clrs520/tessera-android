// R72 pre-design probe: how much width would each 「补年份」 candidate actually cost,
// measured in the live page (text swap + real boxes), for zh and en.
(() => {
  const v = window.viewer;
  if (!v) return JSON.stringify({ err: 'no viewer' });
  const chip = document.getElementById('headerEventName');
  const loc = document.getElementById('headerLocationDisplay');
  const clk = document.getElementById('realTimeClock');
  const hdr = document.querySelector('.main-header');
  const clip = el => el.scrollWidth > el.clientWidth + 1;
  const contentW = Math.round(hdr.clientWidth - parseFloat(getComputedStyle(hdr).paddingLeft) - parseFloat(getComputedStyle(hdr).paddingRight));

  const real = { chip: chip.textContent, loc: loc.innerHTML };
  const longAddr = '📍 <span class="city-text">杭州市 · 文三路 与 教工路 交叉口 往东 200 米</span>';
  const rows = [];
  const measure = (name, chipTxt, addr, desktopClock) => {
    chip.textContent = chipTxt;
    loc.innerHTML = addr;
    const realPhone = window.isPhoneLayout;
    if (desktopClock) window.isPhoneLayout = () => false;
    v.videoControls.updateRealTimeClock();
    if (desktopClock) window.isPhoneLayout = realPhone;
    const c = Math.round(chip.getBoundingClientRect().width), l = Math.round(loc.getBoundingClientRect().width);
    const k = Math.round(clk.getBoundingClientRect().width);
    rows.push({ name, clock: clk.textContent.trim(), chip: c, chipNeed: chip.scrollWidth, chipClip: clip(chip), loc: l, locNeed: loc.scrollWidth, locClip: clip(loc), clk: k,
                sum: chip.scrollWidth + loc.scrollWidth + k + 22, fits: chip.scrollWidth + loc.scrollWidth + k + 22 <= contentW });
  };
  const shortAddr = '📍 <span class="city-text">杭州市 · 文三路</span>';

  measure('现状（chip 10-08 07:30 / 时钟 HH:MM:SS）', '💾 保存片段 10-08 07:30', shortAddr);
  measure('A chip 全日期、去掉时分', '💾 保存片段 2026-10-08', shortAddr);
  measure('B chip 全日期 + 时分', '💾 保存片段 2026-10-08 07:30', shortAddr);
  measure('C 时钟恢复全日期时间', '💾 保存片段 10-08 07:30', shortAddr, true);
  measure('A 英文', '💾 Saved Clips 2026-10-08', shortAddr);
  measure('B 英文', '💾 Saved Clips 2026-10-08 07:30', shortAddr);
  measure('A 长地址', '💾 保存片段 2026-10-08', longAddr);
  measure('B 长地址', '💾 保存片段 2026-10-08 07:30', longAddr);

  chip.textContent = real.chip; loc.innerHTML = real.loc;
  v.videoControls.updateRealTimeClock();
  return JSON.stringify({ contentW, restored: clk.textContent.trim(), rows }, null, 1);
})()

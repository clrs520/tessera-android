// The 1.1.5 bug on the real device: entering immersive hides the bottom bar with `display:none`,
// a zero-size rect used to publish the whole viewport as `--action-h`, and every surface sized by
// it (the ⋮ panel, the 详细数据 plate) collapsed. Walk into immersive and prove both still fit.
//
//   node devtools/probe-r15-immersive.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';

const expr = `(async () => {
  const g = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const out = { vp: innerWidth + 'x' + innerHeight, event: (window.viewer.currentEvent || {}).eventId };
  const hr = document.getElementById('headerRight');
  const menu = document.querySelector('.header-actions-group');
  const stats = document.querySelector('.stats-overlay');
  const box = (el) => { const r = el.getBoundingClientRect();
      return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top); };

  const probe = (label) => {
    hr.classList.add('active');
    return new Promise(async (res) => {
      await new Promise(r => setTimeout(r, 400));
      const rows = Array.from(menu.querySelectorAll('button, a'));
      const last = rows[rows.length - 1];
      const lr = last.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(lr.left + lr.width / 2), Math.round(lr.top + lr.height / 2));
      const cs = getComputedStyle(menu);
      const shown = rows.filter(b => { const r = b.getBoundingClientRect();
          return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }).length;
      const o = { label, actionH: g('--action-h'), barDisplay: getComputedStyle(document.getElementById('phoneActionBar')).display,
          panel: box(menu), maxHeight: cs.maxHeight, visibleRows: shown + '/' + rows.length,
          lastRow: last.textContent.trim().slice(0, 6) + ' ' + Math.round(lr.top) + '-' + Math.round(lr.bottom),
          hitOnLast: menu.contains(hit), statsBox: box(stats) };
      hr.classList.remove('active');
      await new Promise(r => setTimeout(r, 200));
      res(o);
    });
  };

  out.states = [];
  out.states.push(await probe('normal'));

  document.body.classList.add('immersive');
  await new Promise(r => setTimeout(r, 700));
  out.states.push(await probe('immersive'));

  document.body.classList.remove('immersive');
  await new Promise(r => setTimeout(r, 700));
  out.states.push(await probe('back-to-normal'));

  // The plate itself: open it inside immersive, where the crash of the reserve used to clip it.
  document.body.classList.add('immersive');
  await new Promise(r => setTimeout(r, 500));
  hr.classList.add('active');
  await new Promise(r => setTimeout(r, 300));
  const rows = Array.from(menu.querySelectorAll('button, a'));
  if (!stats.classList.contains('show')) rows[1].click();
  await new Promise(r => setTimeout(r, 400));
  hr.classList.remove('active');
  const sr = stats.getBoundingClientRect();
  out.statsInImmersive = {
    cls: stats.className, box: box(stats), maxH: getComputedStyle(stats).maxHeight,
    scroll: stats.scrollHeight + '/' + stats.clientHeight,
    labelColor: getComputedStyle(stats.querySelector('.stats-label')).color,
    valueColor: getComputedStyle(stats.querySelector('.stats-value')).color,
    bg: getComputedStyle(stats).backgroundColor,
    dark: document.body.classList.contains('dark-theme'),
  };
  document.body.classList.remove('immersive');
  return JSON.stringify(out, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r15-immersive.js`;
writeFileSync(tmp, expr, 'utf8');
console.log(execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', tmp], { encoding: 'utf8', timeout: 120000 }));

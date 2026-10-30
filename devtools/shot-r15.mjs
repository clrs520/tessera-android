// Round-15 visual pass on the emulator: drive the four surfaces the user photographed
// (四宫格 / 六宫格 / 大小窗 / ⋮ 菜单 / 详细数据) and grab real screenshots.
// The app fades the header out on its own hide-timer, so every shot starts by calling
// showControls() to bring the chrome back, and the synthetic crash banner is dismissed first.
//   node devtools/shot-r15.mjs
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const adb = 'C:/Users/Xingcong/AppData/Local/Android/Sdk/platform-tools/adb.exe';

const run = (expr) => {
  const f = `${root}/devtools/.shot-r15.js`;
  writeFileSync(f, expr, 'utf8');
  return execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', f],
    { encoding: 'utf8', timeout: 90000 }).trim();
};
const shot = (name) => {
  const png = execFileSync(adb, ['-s', 'emulator-5554', 'exec-out', 'screencap', '-p'],
    { encoding: 'buffer', maxBuffer: 40 * 1024 * 1024, timeout: 60000 });
  writeFileSync(`${root}/devtools/shot-r15-${name}.png`, png);
  return png.length;
};

const INIT = `(() => {
  const S = window.__r15 = {};
  S.prep = (dark) => {
    document.getElementById('jsErrorBanner').style.display = 'none';
    document.querySelector('.stats-overlay').classList.remove('show');
    document.getElementById('headerRight').classList.remove('active');
    document.body.classList.toggle('dark-theme', dark);
    window.viewer.videoControls.showControls();
  };
  S.layout = (name, dark) => { S.prep(dark);
    const p = window.viewer.multiCameraPlayer; p.layoutMode = name; p.updateLayout();
    return name + ' dark=' + document.body.classList.contains('dark-theme'); };
  S.menu = (dark) => { S.prep(dark);
    document.getElementById('headerRight').classList.add('active');
    const m = document.querySelector('.header-actions-group'); const r = m.getBoundingClientRect();
    return JSON.stringify({ panel: Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top),
      op: getComputedStyle(m).opacity, rows: m.querySelectorAll('button, a').length }); };
  S.stats = (dark) => { S.prep(dark);
    const rows = Array.from(document.querySelectorAll('.header-actions-group button, .header-actions-group a'));
    rows[1].click();
    const s = document.querySelector('.stats-overlay'); const r = s.getBoundingClientRect();
    return JSON.stringify({ show: s.classList.contains('show'),
      box: Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top),
      label: getComputedStyle(s.querySelector('.stats-label')).color }); };
  return 'ready';
})()`;

const cases = [
  ['grid4-light', `__r15.layout('grid4', false)`, 1500],
  ['grid-light', `__r15.layout('grid', false)`, 1500],
  ['legacy-light', `__r15.layout('legacy', false)`, 1500],
  ['menu-light', `__r15.menu(false)`, 450],
  ['stats-light', `__r15.stats(false)`, 450],
  ['grid4-dark', `__r15.layout('grid4', true)`, 1500],
  ['legacy-dark', `__r15.layout('legacy', true)`, 1500],
  ['stats-dark', `__r15.stats(true)`, 450],
];

console.log('init', run(INIT));
for (const [name, expr, pause] of cases) {
  const info = run(`(${expr})`);
  await new Promise(r => setTimeout(r, pause));
  console.log(name, '|', info, '|', shot(name), 'bytes');
}

// Measure the round-10 sidebar geometry without rebuilding the APK: the *current* styles.css
// and the new markup are injected into the running 1.0.9 page, so the numbers come from the
// real rules rather than a hand-copied subset.
//
//   node devtools/probe-r10-layout.mjs            # portrait
//   node devtools/probe-r10-layout.mjs landscape
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998';
const css = readFileSync(`${root}/TDashcamStudio/src/styles.css`, 'utf8');
const html = readFileSync(`${root}/TDashcamStudio/src/index.html`, 'utf8');

const grab = (start, end) => {
    const from = html.indexOf(start);
    if (from < 0) throw new Error(`markup not found: ${start}`);
    const to = html.indexOf(end, from);
    return html.slice(from, to < 0 ? html.length : to).replace(/\r\n/g, '\n').trim();
};
const quick = grab('<div id="quickFilters"', '<div id="permBanner"');
const banner = grab('<div id="permBanner"', '<div id="fileList"');

const expr = `(() => {
  const css = ${JSON.stringify(css)};
  document.getElementById('r10-patch')?.remove();
  let style = document.getElementById('r10-live');
  if (!style) { style = document.createElement('style'); style.id = 'r10-live'; document.head.appendChild(style); }
  style.textContent = css;

  // A previous probe run may have left a differently shaped copy behind.
  document.getElementById('quickFilters')?.remove();
  document.getElementById('permBanner')?.remove();
  document.querySelector('.filters').insertAdjacentHTML('afterend', ${JSON.stringify(quick + '\n' + banner)});

  const chips = document.getElementById('dateChips');
  if (chips && !chips.children.length) {
    ['全部日期', '10-09', '10-08', '10-07', '10-06', '10-05', '10-03', '09-28', '09-25'].forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'date-chip' + (i === 0 ? ' is-active' : '');
      b.textContent = d;
      chips.appendChild(b);
    });
  }
  const pb = document.getElementById('permBanner');
  if (pb) { pb.style.display = 'flex'; document.getElementById('permBannerText').textContent = '缺少「所有文件访问」权限，拷进来的录像现在是看不见的。'; document.getElementById('permBannerBtn').textContent = '去设置'; }

  const h = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return sel + ':missing';
    const r = el.getBoundingClientRect();
    return sel + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top);
  };
  const list = document.getElementById('fileList').getBoundingClientRect();
  return JSON.stringify({
    vp: innerWidth + 'x' + innerHeight,
    list: 'top ' + Math.round(list.top) + ' h ' + Math.round(list.height),
    rows: ['.sidebar-header', '.filters', '#quickFilters', '.event-search', '.date-chips', '.date-chip', '#permBanner', '.sidebar-footer'].map(h),
    chipScroll: chips ? chips.scrollWidth + '/' + chips.clientWidth : 'none',
  }, null, 1);
})()`;

const tmp = `${root}/devtools/.probe-r10-live.js`;
writeFileSync(tmp, expr, 'utf8');
console.log(execFileSync(process.execPath, [`${root}/devtools/cdp-eval.mjs`, '--file', tmp], { encoding: 'utf8' }));

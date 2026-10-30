// Node-side runner: injects the real styles.css plus the current #phoneExportModal markup from
// index.html, then reports the sheet's geometry in the live page's orientation. The page cannot
// read files, so the CSS and markup are spliced in here.
//
//   node devtools/probe-r21-sheet.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..', 'TDashcamStudio', 'src');
const css = readFileSync(path.join(root, 'styles.css'), 'utf8');

// Take exactly the sheet's markup out of index.html so the probe cannot drift from the real file.
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const from = html.indexOf('<div id="phoneExportModal"');
const afterClose = html.indexOf('id="peCloseBtn"');
const firstEnd = html.indexOf('</div>', afterClose);
const secondEnd = html.indexOf('</div>', firstEnd + 6);
const sheetMarkup = html.slice(from, secondEnd + 6);

const page = `
(() => {
const PROBE_CSS = ${JSON.stringify(css)};
const MARKUP = ${JSON.stringify(sheetMarkup)};
document.getElementById('probe-r21-sheet')?.remove();
const style = document.createElement('style');
style.id = 'probe-r21-sheet';
style.textContent = PROBE_CSS;
document.head.appendChild(style);

const live = document.getElementById('phoneExportModal');
live.outerHTML = MARKUP;
const sheet = document.getElementById('phoneExportModal');
sheet.style.display = 'flex';
sheet.classList.add('show');

// The chips are rendered by JS; stand in for them with the real camera names.
const cameras = ['front', 'back', 'left', 'right', 'left_pillar', 'right_pillar'];
document.getElementById('peCameraChips').innerHTML = cameras.map((c, i) =>
    '<button type="button" class="recent-chip' + (i < 3 ? ' on' : '') + '">' + c + '</button>').join('');
document.getElementById('peSizeChips').innerHTML = ['源', '1080p', '720p', '480p'].map((c, i) =>
    '<button type="button" class="recent-chip' + (i === 1 ? ' on' : '') + '">' + c + '</button>').join('');
document.getElementById('peStartInput').value = '00:03';
document.getElementById('peEndInput').value = '00:12';

const r = (el) => {
  const b = el.getBoundingClientRect();
  return Math.round(b.width) + 'x' + Math.round(b.height) + '@' + Math.round(b.left) + ',' + Math.round(b.top);
};
const range = document.querySelector('.pe-range');
const rowsOf = (nodes) => {
  const tops = new Set(nodes.map((n) => Math.round(n.getBoundingClientRect().top)));
  return [...tops].sort((a, b) => a - b).map((t) => Math.round(t));
};
const out = {
  inner: [innerWidth, innerHeight],
  kbH: getComputedStyle(document.documentElement).getPropertyValue('--kb-h').trim() || 'unset',
  sheetBottom: getComputedStyle(sheet).getPropertyValue('--sheet-bottom').trim().replace(/\\s+/g, ' '),
  panel: r(document.querySelector('.phone-export-panel')),
  panelScroll: Math.round(document.querySelector('.phone-export-panel').scrollHeight)
      + '/' + Math.round(document.querySelector('.phone-export-panel').clientHeight),
  range: r(range),
  rangeRows: rowsOf([...range.children]),
  nudge: r(document.querySelector('.pe-nudge')),
  time: r(document.getElementById('peStartInput')),
  mini: r(document.getElementById('peFromNowBtn')),
  firstNudgeLeft: Math.round(document.querySelector('.pe-nudge').getBoundingClientRect().left),
  lastNudgeRight: Math.round([...document.querySelectorAll('.pe-nudge')].pop().getBoundingClientRect().right),
};
return JSON.stringify(out, null, 1);
})();
`;

const tmp = path.join(here, '.tmp-probe-r21-sheet.js');
writeFileSync(tmp, page, 'utf8');
console.log(execFileSync(process.execPath, [path.join(here, 'cdp-eval.mjs'), '--file', tmp],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));

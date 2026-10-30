// Node-side runner: splices the real styles.css into a page probe (the page cannot read files),
// then measures the export sheet with and without a simulated keyboard height.
//
//   node devtools/probe-r21-kb.mjs [css-path]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const cssPath = process.argv[2] || path.join(here, '..', 'TDashcamStudio', 'src', 'styles.css');
const css = readFileSync(cssPath, 'utf8');

const page = `
const CSS = ${JSON.stringify(css)};
document.getElementById('probe-r21-kb')?.remove();
const style = document.createElement('style');
style.id = 'probe-r21-kb';
style.textContent = CSS;
document.head.appendChild(style);

const root = document.documentElement;
const sheet = document.querySelector('.phone-export-sheet');
const panel = document.querySelector('.phone-export-panel');
const out = { inner: [innerWidth, innerHeight], sheet: !!sheet };
if (!sheet) JSON.stringify(out);

const measure = (label) => {
  const p = panel.getBoundingClientRect();
  const start = document.getElementById('peStartInput')?.getBoundingClientRect();
  out[label] = {
    kbH: getComputedStyle(root).getPropertyValue('--kb-h').trim(),
    sheetBottom: getComputedStyle(sheet).getPropertyValue('--sheet-bottom').trim(),
    panel: Math.round(p.width) + 'x' + Math.round(p.height) + '@' + Math.round(p.left) + ',' + Math.round(p.top),
    panelTop: Math.round(p.top),
    panelBottom: Math.round(p.bottom),
    overflowY: getComputedStyle(panel).overflowY,
    scroll: Math.round(panel.scrollHeight) + '/' + Math.round(panel.clientHeight),
    startBottom: start ? Math.round(start.bottom) : null,
  };
};

[['kb_0', '0px'], ['kb_184', '184px'], ['kb_300', '300px'], ['kb_unset', null]].forEach(([label, value]) => {
  if (value) root.style.setProperty('--kb-h', value); else root.style.removeProperty('--kb-h');
  measure(label);
});
root.style.setProperty('--kb-h', '184px');
panel.scrollTop = panel.scrollHeight;
out.scrolled = { startBottom: Math.round(document.getElementById('peStartInput').getBoundingClientRect().bottom) };
root.style.removeProperty('--kb-h');
JSON.stringify(out, null, 1);
`;

const tmp = path.join(here, '.tmp-probe-r21-kb.js');
writeFileSync(tmp, page, 'utf8');
console.log(execFileSync(process.execPath, [path.join(here, 'cdp-eval.mjs'), '--file', tmp],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));

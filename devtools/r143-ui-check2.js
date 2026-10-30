const fs = require('fs');
const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio';
const html = fs.readFileSync(root + '/src/index.html', 'utf8');
const js = fs.readFileSync(root + '/src/script.js', 'utf8');
const css = fs.readFileSync(root + '/src/styles.css', 'utf8').split('\n');

// --- precise slice of the updateAllUIText definition ---
const def = js.indexOf('updateAllUIText(lang) {');
console.log('definition at char', def, 'line', js.slice(0, def).split('\n').length);
let depth = 0, end = def;
for (let i = js.indexOf('{', def); i < js.length; i++) {
    if (js[i] === '{') depth++;
    else if (js[i] === '}') { depth--; if (!depth) { end = i; break; } }
}
const fn = js.slice(def, end);
console.log('function length:', fn.length, 'lines:', fn.split('\n').length);

const keys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
const referenced = new Set([...fn.matchAll(/['"]([A-Za-z][A-Za-z0-9]{2,})['"]/g)].map(m => m[1]));
const missing = keys.filter(k => !referenced.has(k));
console.log('data-i18n keys:', keys.length, '| not covered by updateAllUIText:', missing.length, '->', missing.join(', '));

// --- which nodes carry the missing keys, and is any of them written by JS elsewhere? ---
missing.forEach(k => {
    const at = html.indexOf('data-i18n="' + k + '"');
    const tag = html.slice(html.lastIndexOf('<', at), at + 60).replace(/\s+/g, ' ');
    const idm = tag.match(/id="([^"]+)"/);
    const touched = idm ? js.includes("'" + idm[1] + "'") || js.includes('#' + idm[1]) : false;
    const writes = idm ? [...js.matchAll(new RegExp('dom\\.' + idm[1] + '\\b|getElementById\\(.?' + idm[1], 'g'))].length : 0;
    console.log('  -', k, '| id=' + (idm ? idm[1] : '-'), '| literal refs in JS:', writes);
});

// --- aria-labels: which are never rewritten by JS ---
const ariaNodes = [...html.matchAll(/<([a-z]+)([^>]*?aria-label="([^"]+)")([^>]*?)>/g)];
const managed = ['headerAria', 'updateTabAriaLabels', 'peZoomOpen', 'phoneFramePrev', 'phoneFrameNext'];
console.log('--- Chinese aria-labels and whether JS rewrites them ---');
ariaNodes.forEach(m => {
    const label = m[3];
    if (!/[\u4e00-\u9fff]/.test(label)) return;
    const idm = m[2].match(/id="([^"]+)"/);
    const id = idm ? idm[1] : null;
    const hit = id ? js.includes(id) : false;
    console.log('  ', (id || '(no id)').padEnd(22), label.padEnd(10), id && hit ? 'id appears in JS' : 'NOT in JS');
});

// --- accessible name check for the two icon buttons ---
['filterToggleBtn', 'clearDateBtn'].forEach(id => {
    const at = html.indexOf('id="' + id + '"');
    console.log('---', id, '---');
    console.log(html.slice(html.lastIndexOf('<', at), html.indexOf('>', at + 200)).replace(/\s+/g, ' ').slice(0, 320));
});

// --- the .pe-nav-go rule with its line number, and the token cascade ---
css.forEach((l, i) => {
    if (/\.pe-nav-go|\.pe-nav-cancel/.test(l)) console.log('css:' + (i + 1), l.trim());
    if (/^\s*(--accent|--accent-solid|--glass-tint):/.test(l)) console.log('css:' + (i + 1), l.trim());
});
const navGo = css.findIndex((l, i) => l.includes('.pe-nav-go {'));
if (navGo >= 0) console.log('block:\n' + css.slice(navGo, navGo + 12).join('\n'));

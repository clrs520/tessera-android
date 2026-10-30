const fs = require('fs');
const root = 'C:/Users/Xingcong/Documents/Qoder/2026-10-08/bd860998/TDashcamStudio';
const html = fs.readFileSync(root + '/src/index.html', 'utf8');
const js = fs.readFileSync(root + '/src/script.js', 'utf8');
const css = fs.readFileSync(root + '/src/styles.css', 'utf8');

// 1) every data-i18n key in the HTML vs what updateAllUIText actually touches
const at = js.indexOf('updateAllUIText(lang)');
const fn = js.slice(at, at + 30000);
const keys = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]))];
const referenced = new Set([...fn.matchAll(/['"]([A-Za-z][A-Za-z0-9]{2,})['"]/g)].map(m => m[1]));
const missing = keys.filter(k => !referenced.has(k));
console.log('HTML data-i18n keys:', keys.length);
console.log('not referenced in updateAllUIText:', missing.length, '->', missing.join(', '));
console.log('generic [data-i18n] loop:', js.includes("querySelectorAll('[data-i18n]')"),
    '| placeholder loop:', js.includes('data-i18n-placeholder'),
    '| any aria loop:', js.includes('data-i18n-aria'));

// 2) static Chinese aria-labels in the HTML
const arias = [...html.matchAll(/aria-label="([^"]+)"/g)].map(m => m[1]);
const zh = arias.filter(a => /[\u4e00-\u9fff]/.test(a));
console.log('aria-label attrs:', arias.length, '| hardcoded Chinese:', zh.length, '->', zh.join(' / '));

// 3) svg-only buttons with no accessible name
const nameless = [];
[...html.matchAll(/<button[^>]*>/g)].forEach(m => {
    const tag = m[0];
    const body = html.slice(m.index + tag.length, m.index + tag.length + 300);
    if (!/aria-label|data-i18n-aria/.test(tag) && !/btn-text/.test(body) && /<svg/.test(body)) {
        nameless.push((tag.match(/id="([^"]+)"/) || [, '?'])[1]);
    }
});
console.log('svg-only buttons without aria-label:', nameless.join(', ') || '(none)');

// 4) focus management / inert
console.log('.focus() count:', (js.match(/\.focus\(\)/g) || []).length,
    '| inert mentions:', (js.match(/inert/g) || []).length);

// 5) the accent chain behind .pe-nav-go
const i = css.indexOf('.pe-nav-go');
console.log('--- .pe-nav-go rule ---');
console.log(css.slice(i, i + 260).replace(/\s+/g, ' '));
['--accent', '--accent-solid', '--glass-tint'].forEach(name => {
    const hits = css.split('\n').filter(l => l.trim().startsWith(name + ':')).slice(0, 6);
    console.log(name, '=>', hits.map(h => h.trim()).join(' | '));
});

// R182 · 结构自检：CSS 的花括号配不配平（我刚刚就截断过一条规则）。
const fs = require('fs');
const file = process.argv[2] || 'TDashcamStudio/src/styles.css';
const raw = fs.readFileSync(file, 'utf8');
const s = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '');
let depth = 0;
let line = 1;
let worst = 0;
for (const ch of s) {
    if (ch === '\n') line += 1;
    if (ch === '{') depth += 1;
    if (ch === '}') { depth -= 1; if (depth < 0) { worst = Math.min(worst, depth); depth = 0; } }
}
console.log(JSON.stringify({ file, netDepth: depth, minDepth: worst, lines: raw.split('\n').length }));
process.exit(depth === 0 && worst === 0 ? 0 : 1);

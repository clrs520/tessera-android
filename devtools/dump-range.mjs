// Dump assistant/user text from the session transcript in a line range, trimmed.
//   node devtools/dump-range.mjs <startLine> <endLine> [charCap]
import { readFileSync } from 'node:fs';

const FILE = 'C:/Users/Xingcong/.qoder-cn/projects/C--Users-Xingcong-Documents-Qoder-2026-10-08-bd860998/bd860998-615e-4ddb-8772-e8eac3b4b3da.jsonl';
const [a, b, cap] = process.argv.slice(2);
const start = Number(a) || 0;
const end = Math.min(Number(b) || start + 40, 100000);
const chars = Number(cap) || 1200;

const lines = readFileSync(FILE, 'utf8').split('\n');
for (let i = start; i < end; i++) {
    const L = lines[i];
    if (!L) continue;
    let o;
    try { o = JSON.parse(L); } catch { continue; }
    const m = o.message;
    if (!m || typeof m !== 'object') continue;
    const parts = [];
    const c = m.content;
    if (typeof c === 'string') parts.push(c);
    else if (Array.isArray(c)) {
        for (const x of c) {
            if (!x || typeof x !== 'object') continue;
            if (x.type === 'text') parts.push(x.text);
            else if (x.type === 'tool_use') parts.push(`[TOOL ${x.name} ${JSON.stringify(x.input ?? {}).slice(0, 400)}]`);
            else if (x.type === 'tool_result') parts.push(`[RESULT ${JSON.stringify(x.content ?? '').slice(0, 300)}]`);
            else parts.push(`[${x.type}]`);
        }
    }
    const txt = parts.join('\n').replace(/\s+/g, ' ');
    if (!txt) continue;
    console.log(`--- ${i} ${m.role}`);
    console.log(txt.slice(0, chars));
}

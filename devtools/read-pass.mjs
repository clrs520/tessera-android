// 读一份 cdp-eval 的输出：`{pass:[],fail:[]}` 打计数与所有红条，其它形状原样打前 600 字。
// 为什么要这么个文件：把 `node -e "..."` 塞进 bash 的 for 循环里，引号一多就会静默什么也不打
// （R109 实测：三条套件的链式跑法只留下两个 0 字节文件，看着像探针全挂了）。
import { readFileSync } from 'node:fs';
const raw = readFileSync(process.argv[2], 'utf8');
let j;
try { j = JSON.parse(raw); } catch (e) {
    console.log(`NOT JSON (${raw.length} B): ${raw.slice(0, 600) || '(空 —— 进程被杀或输出没落地)'}`);
    process.exit(1);
}
if (Array.isArray(j.pass)) {
    console.log(`PASS ${j.pass.length}  FAIL ${(j.fail || []).length}`);
    for (const k of ['orient', 'load', 'backdrop', 'events', 'note', 'trace'])
        if (j[k] !== undefined) console.log(`  ${k}: ${JSON.stringify(j[k])}`);
    (j.fail || []).forEach((x) => console.log(`   x ${x}`));
} else {
    // 采样型探针（r110-release-audit）没有 pass/fail，但它的关键结论在 verdict 这类字段里，
    // 原样截 1200 字经常正好把它截掉 —— 先把 verdict 单独打出来，再打剩下的。
    for (const [k, v] of Object.entries(j))
        if (/verdict$/i.test(k)) console.log(`  ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    console.log(JSON.stringify(j).slice(0, 2000));
}

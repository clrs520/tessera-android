// R183 · 字号普查的静态对照：运行时那份账只量「判据能填上字的面」，标题类节点只要产品代码
// 没被走过就是盲区。这一支不跑设备，直接把 CSS 里所有 font-size 字面量按「是否手机档」列出来，
// 档位外的（11/12/14.08/16 之外）全部摊开，靠人判哪些真的会画到手机上。
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || 'TDashcamStudio/src/styles.css', 'utf8');
const lines = src.split(/\r?\n/);
const TIERS = [11, 12, 14.08, 16];
let stack = [];
const out = [];
for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const l = raw.trim();
    // track blocks so each declaration knows its enclosing @media / selector chain
    for (const ch of l) {
        if (ch === '{') stack.push(l.endsWith('}') ? '' : l.replace('{', '').trim());
        else if (ch === '}') stack.pop();
    }
    const m = /^font-size:\s*([^;]+);/.exec(l);
    if (!m) continue;
    const val = m[1].trim();
    if (/var\(/.test(val)) continue;                       // token 走的那批不用逐个看
    const num = /(\d*\.?\d+)\s*(rem|px)/.exec(val);
    if (!num) continue;
    const px = parseFloat(num[1]) * (num[2] === 'rem' ? 16 : 1);
    if (TIERS.some((t) => Math.abs(px - t) < 0.05)) continue;
    const chain = stack.filter(Boolean);
    const phone = chain.some((c) => /max-width:\s*768px|pointer:\s*coarse|max-height:\s*620px/.test(c))
        || /\.touch-ui|touch-ui\b/.test(chain.join(' '));
    out.push({ line: i + 1, px: px.toFixed(2), val, phone, sel: chain[chain.length - 1] || '(root)',
        media: chain.find((c) => c.startsWith('@media')) || '' });
}
const grouped = out.filter((r) => r.phone);
if (process.argv.includes('--json')) {
    console.log(JSON.stringify(grouped));
} else {
    console.log('手机档里档位外的 font-size：' + grouped.length + ' 处');
    for (const r of grouped) console.log(`  L${r.line} ${r.px}px  ${r.sel}  @media ${r.media.slice(0, 70)}`);
    console.log('\n共享/桌面（不改，只作对照）：' + out.filter((r) => !r.phone).length + ' 处');
    for (const r of out.filter((r) => !r.phone)) console.log(`  L${r.line} ${r.px}px  ${r.sel}`);
}

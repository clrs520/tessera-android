const fs = require('fs');
const p = 'C:/Users/Xingcong/.qoder-cn/app/chat-session-visualizations/bd860998-615e-4ddb-8772-e8eac3b4b3da/visualizations/r171-landscape-filters.html';
let s = fs.readFileSync(p, 'utf8');
function rep(a, b, label) {
  if (!s.includes(a)) { console.error('MISS', label); process.exit(1); }
  s = s.replace(a, b);
}

rep('.mode-a .panel .segments,.mode-a .panel .chip,.mode-a .panel .date-field,.mode-a .panel .src{background:#fff}',
    '.mode-a .panel .segments,.mode-a .panel .chip:not(.on),.mode-a .panel .date-field,.mode-a .panel .src:not(.on){background:#fff}',
    'a-chip-bg');
rep('.mode-ab .panel .segments,.mode-ab .panel .chip,.mode-ab .panel .src{background:#fff}',
    '.mode-ab .panel .segments,.mode-ab .panel .chip:not(.on),.mode-ab .panel .src:not(.on){background:#fff}',
    'ab-chip-bg');

rep('  .panel-body{flex:1 1 auto;min-height:0;padding:2px 14px 12px;display:flex;flex-direction:column;gap:10px}',
    '  .panel-body{flex:1 1 auto;min-height:0;padding:2px 14px 12px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden}',
    'body-scroll');

rep('  .date-row .cal{flex:0 0 34px;width:34px;padding:0}',
    '  .date-row .cal{flex:0 0 34px;width:34px;padding:0;background:var(--purple-soft);border-color:transparent;color:var(--purple);font-size:14px}',
    'cal');

rep(`  /* The annotation moves to the video side, clear of both columns. */`,
`  /* The proposals are denser: the same controls plus a histogram and source sizes must fit a 412px screen. */
  .mode-c .panel-body,.mode-a .panel-body,.mode-ab .panel-body{gap:6px;padding-top:8px}
  .mode-c .hist,.mode-a .hist,.mode-ab .hist{height:64px}
  .mode-c .src-card,.mode-a .src-card,.mode-ab .src-card{height:38px}
  .mode-c .panel-summary,.mode-a .panel-summary,.mode-ab .panel-summary{height:28px}
  .mode-c .row-label,.mode-a .row-label,.mode-ab .row-label{margin-bottom:-2px}

  /* The annotation moves to the video side, clear of both columns. */`,
    'density');

fs.writeFileSync(p, s);
console.log('patched', fs.statSync(p).size);
